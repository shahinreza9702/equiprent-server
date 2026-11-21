import type { RequestHandler } from "express";

import ApiError from "../utils/api-error.js";
import HTTP_STATUS from "../constants/http-status.js";
import asyncHandler from "../utils/async-handler.js";

import User from "../modules/users/users.model.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";

import type { JwtPayload } from "../modules/auth/auth.types.js";

const authMiddleware: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    let decoded: JwtPayload;

    // Verify JWT
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid or expired access token",
      );
    }

    // Find the latest user information
    const user = await User.findById(decoded.userId).select(
      "_id email role status",
    );

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "User account not found",
      );
    }

    // Reject blocked accounts
    if (user.status !== "active") {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "Your account has been blocked",
      );
    }

    // Attach current database information
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  },
);

export default authMiddleware;