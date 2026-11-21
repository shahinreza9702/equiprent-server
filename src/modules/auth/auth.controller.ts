import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";
import { env } from "../../config/env.js";

import { authService } from "./auth.service.js";
import { authValidation } from "./auth.validation.js";

const loginUser: RequestHandler = asyncHandler(
  async (req, res) => {
    // Validate login data
    const validationResult =
      authValidation.loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    // Authenticate user
    const { user, accessToken, refreshToken } =
      await authService.loginUser(validationResult.data);

    // Set secure HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: env.JWT_ACCESS_COOKIE_MAX_AGE_MS,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: env.JWT_REFRESH_COOKIE_MAX_AGE_MS,
      path: "/",
    });

    // Send login response
    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Login successful",
      data: {
        user,
      },
    });
  },
);

export const authController = {
  loginUser,
};