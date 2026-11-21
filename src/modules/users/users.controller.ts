
import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import { usersService } from "./users.service.js";
import { userValidation } from "./users.validation.js";

// Register user
const registerUser: RequestHandler = asyncHandler(
  async (req, res) => {
    const validationResult =
      userValidation.registerUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    const user = await usersService.registerUser(
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "User registered successfully",
      data: user,
    });
  },
);

// Get authenticated user's profile
const getMyProfile: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const user = await usersService.getMyProfile(
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Profile retrieved successfully",
      data: user,
    });
  },
);

// Update authenticated user's profile
const updateMyProfile: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    // Validate profile update data
    const validationResult =
      userValidation.updateProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    // Update profile
    const user = await usersService.updateMyProfile(
      req.user.userId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Profile updated successfully",
      data: user,
    });
  },
);

export const usersController = {
  registerUser,
  getMyProfile,
  updateMyProfile,
};
