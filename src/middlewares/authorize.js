import AppError from "../utils/AppError.js";

/**
 * authorize — role guard. Call AFTER authenticate.
 *
 * Usage:
 *   router.use(authenticate, authorize("admin", "super_admin"))
 *   router.get("/", authorize("admin"), handler)
 */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          403
        )
      );
    }
    return next();
  };

/**
 * authorizeOwner — lets a resource owner (or any of the given roles)
 * through. e.g. authorizeOwner(["admin"], req.user, resource.userId)
 */
const authorizeOwner = (roles, ownerUserId, req) => {
  if (roles.includes(req.user.role)) return true;
  return String(ownerUserId) === String(req.user._id);
};

export { authorize, authorizeOwner };
