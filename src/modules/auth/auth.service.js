import User from "../users/users.model.js";
import AppError from "../../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  signOtpToken,
  verifyOtpToken,
  verifyRefreshToken,
} from "../../utils/token.js";
import { sendEmail, verificationEmail, passwordResetEmail } from "../../utils/email.js";
import config from "../../config/index.js";

/**
 * Register a new user (role customer by default).
 * Returns { user, accessToken, refreshToken, emailSent }.
 */
async function register({ name, email, password, phone }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({ name, email: normalizedEmail, password, phone });

  const emailVerificationToken = signOtpToken({ _id: user._id, purpose: "email_verify" }, "1h");
  user.emailVerificationToken = emailVerificationToken;
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${emailVerificationToken}`;
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Verify your email",
    html: verificationEmail(user.name, verifyUrl),
  });

  const payload = { _id: user._id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return { user: user.toPublicJSON(), accessToken, refreshToken, emailSent };
}

/**
 * Log a user in with email + password.
 */
async function login({ email, password }) {
  const user = await User.findByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }
  if (user.isBlocked) {
    throw new AppError("Your account has been blocked. Contact support.", 403);
  }

  const payload = { _id: user._id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return { user: user.toPublicJSON(), accessToken, refreshToken };
}

/**
 * Refresh an access token using a valid refresh token.
 */
async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 401);
  }
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid refresh token.", 401);
  }
  const payload = { _id: user._id, role: user.role };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken: newRefreshToken, user: user.toPublicJSON() };
}

/**
 * Log out — clear the stored refresh token.
 */
async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null }, { new: true });
}

/**
 * Verify a user's email address via the emailed token.
 */
async function verifyEmail(token) {
  let decoded;
  try {
    decoded = verifyOtpToken(token);
  } catch {
    throw new AppError("Invalid or expired verification token.", 400);
  }
  if (decoded.purpose !== "email_verify") {
    throw new AppError("Invalid verification token.", 400);
  }
  const user = await User.findById(decoded._id);
  if (!user) throw new AppError("User not found.", 404);
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  await user.save({ validateBeforeSave: false });
  return user.toPublicJSON();
}

/**
 * Resend verification email.
 */
async function resendVerificationEmail(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  if (user.isEmailVerified) {
    throw new AppError("Email is already verified.", 400);
  }
  const emailVerificationToken = signOtpToken({ _id: user._id, purpose: "email_verify" }, "1h");
  user.emailVerificationToken = emailVerificationToken;
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${emailVerificationToken}`;
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Verify your email",
    html: verificationEmail(user.name, verifyUrl),
  });
  return { emailSent };
}

/**
 * Forgot password — email a reset link. Always returns success
 * even if the account doesn't exist (enumeration protection).
 */
async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return { emailSent: false, sent: false };
  }
  const resetToken = signOtpToken({ _id: user._id, purpose: "password_reset" }, "1h");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: passwordResetEmail(user.name, resetUrl),
  });
  return { emailSent, sent: true };
}

/**
 * Reset password using the emailed token.
 */
async function resetPassword(token, newPassword) {
  let decoded;
  try {
    decoded = verifyOtpToken(token);
  } catch {
    throw new AppError("Invalid or expired reset token.", 400);
  }
  if (decoded.purpose !== "password_reset") {
    throw new AppError("Invalid reset token.", 400);
  }
  const user = await User.findById(decoded._id);
  if (!user) throw new AppError("User not found.", 404);

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshToken = null;
  await user.save();

  const welcome = await sendEmail({
    to: user.email,
    subject: "Password changed",
    html: `<p>Hi ${user.name},</p><p>Your password has been successfully changed.</p>`,
  });

  return { user: user.toPublicJSON(), emailSent: welcome };
}

export {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
