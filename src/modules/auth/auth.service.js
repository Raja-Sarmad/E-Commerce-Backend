import User from "../users/users.model.js";
import EmailOtp from "./email-otp.model.js";
import AppError from "../../utils/AppError.js";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  signOtpToken,
  verifyOtpToken,
  verifyRefreshToken,
} from "../../utils/token.js";
import {
  sendEmail,
  verificationEmail,
  passwordResetEmail,
  registrationOtpEmail,
  welcomeEmail,
} from "../../utils/email.js";
import config from "../../config/index.js";

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isMailConfigured() {
  return Boolean(config.mail.user && config.mail.pass);
}

async function sendEmailOtp(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  await EmailOtp.deleteMany({ email: normalizedEmail });
  await EmailOtp.create({
    email: normalizedEmail,
    codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const mailResult = await sendEmail({
    to: normalizedEmail,
    subject: "Your NovaMart registration code",
    html: registrationOtpEmail(code),
    text: `Your NovaMart registration code is ${code}. Valid for 10 minutes.`,
  });

  if (!mailResult.ok) {
    if (config.isDev) {
      console.log(`[email-otp:dev] ${normalizedEmail} -> ${code}`);
      return { sent: true, devMode: true, devOtp: code };
    }
    throw new AppError(
      isMailConfigured()
        ? "Could not send OTP email. Try again later."
        : "Email service is not configured. Set MAIL_USER and MAIL_PASS on the server.",
      503
    );
  }

  return {
    sent: true,
    devMode: false,
    ...(config.isDev ? { devOtp: code } : {}),
  };
}

async function verifyEmailOtp(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const code = String(otp ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new AppError("Please enter the 6-digit OTP code.", 400);
  }

  const record = await EmailOtp.findOne({ email: normalizedEmail, verified: false }).sort({
    createdAt: -1,
  });
  if (!record) {
    throw new AppError("OTP expired or not found. Request a new code.", 400);
  }
  if (record.expiresAt < new Date()) {
    throw new AppError("OTP expired. Request a new code.", 400);
  }
  if (record.attempts >= 5) {
    throw new AppError("Too many attempts. Request a new code.", 429);
  }

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    throw new AppError("Invalid OTP code.", 400);
  }

  record.verified = true;
  await record.save();
  return true;
}

/**
 * Register a new user (role customer by default).
 * Returns { user, accessToken, refreshToken, emailSent }.
 */
async function register({ name, email, password, otp }) {
  const normalizedEmail = email.toLowerCase().trim();

  await verifyEmailOtp(normalizedEmail, otp);

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    isEmailVerified: true,
  });

  await EmailOtp.deleteMany({ email: normalizedEmail });

  const emailSent = await sendEmail({
    to: user.email,
    subject: "Welcome to NovaMart",
    html: welcomeEmail(user.name),
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
  sendEmailOtp,
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
