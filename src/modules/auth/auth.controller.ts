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



const refreshToken: RequestHandler = asyncHandler(
  async (req, res) => {
    // Read refresh token from HTTP-only cookie
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Refresh token is required",
      );
    }

    // Generate new access and refresh tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(rawRefreshToken);

    // Update access token cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: env.JWT_ACCESS_COOKIE_MAX_AGE_MS,
      path: "/",
    });

    // Replace old refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: env.JWT_REFRESH_COOKIE_MAX_AGE_MS,
      path: "/",
    });

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Tokens refreshed successfully",
    });
  },
);


const forgotPassword: RequestHandler = asyncHandler(
  async (req, res) => {
    // Validate forgot password data
    const validationResult =
      authValidation.forgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    // Request password reset
    await authService.forgotPassword(validationResult.data);

    // Return a generic response to prevent account enumeration
    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  },
);


const resetPassword: RequestHandler = asyncHandler(
  async (req, res) => {
    // Validate reset password data
    const validationResult =
      authValidation.resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    // Reset the user's password
    await authService.resetPassword(validationResult.data);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message:
        "Password reset successful. Please log in with your new password.",
    });
  },
);


const logoutUser: RequestHandler = asyncHandler(
  async (req, res) => {
    // Read the current device's refresh token
    const rawRefreshToken = req.cookies?.refreshToken;

    // Revoke the current session if a token exists
    await authService.logoutUser(rawRefreshToken);

    // Clear authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Logout successful",
    });
  },
);

export const authController = {
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
};