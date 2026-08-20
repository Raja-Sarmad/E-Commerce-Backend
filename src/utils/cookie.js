import config from "../config/index.js";

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.accessMaxAgeMs,
  path: "/",
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.refreshMaxAgeMs,
  path: "/",
});

/**
 * Attach access + refresh tokens as httpOnly cookies on the response.
 */
function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(config.cookie.accessName, accessToken, accessCookieOptions());
  res.cookie(config.cookie.refreshName, refreshToken, refreshCookieOptions());
}

/**
 * Clear both auth cookies.
 */
function clearAuthCookies(res) {
  res.clearCookie(config.cookie.accessName, { ...accessCookieOptions(), maxAge: undefined });
  res.clearCookie(config.cookie.refreshName, { ...refreshCookieOptions(), maxAge: undefined });
}

export { accessCookieOptions, refreshCookieOptions, setAuthCookies, clearAuthCookies };
