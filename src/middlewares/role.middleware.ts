import type { RequestHandler } from "express";

import ApiError from "../utils/api-error.js";
import HTTP_STATUS from "../constants/http-status.js";

import type { UserRole } from "../modules/users/users.types.js";

const authorizeRoles = (
  ...allowedRoles: UserRole[]
): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          "Authentication required",
        ),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          "You do not have permission to perform this action",
        ),
      );
    }

    next();
  };
};

export default authorizeRoles;