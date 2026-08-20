import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/token.js";
import User from "../modules/users/users.model.js";

/**
 * authenticate — verifies the access token (Bearer header or httpOnly
 * cookie), loads the user from DB and attaches them to req.user.
 * Sets req.authContext = { token, decoded }.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies[process.env.COOKIE_ACCESS_NAME || "access_token"]) {
    token = req.cookies[process.env.COOKIE_ACCESS_NAME || "access_token"];
  }

  if (!token) {
    return next(new AppError("You are not logged in. Please log in to continue.", 401));
  }

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded._id)
    .select("-password -refreshToken -passwordResetToken -passwordResetExpires")
    .lean();

  if (!user) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }

  if (user.isBlocked) {
    return next(new AppError("Your account has been blocked. Contact support.", 403));
  }

  req.user = user;
  req.authContext = { token, decoded };
  next();
});

export default authenticate;
