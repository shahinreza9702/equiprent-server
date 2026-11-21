import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import { usersService } from "./users.service.js";
import { userValidation } from "./users.validation.js";

const registerUser: RequestHandler = asyncHandler(
  async (req, res) => {
    // Validate registration data
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

    // Register user
    const user = await usersService.registerUser(
      validationResult.data,
    );

    // Send response
    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "User registered successfully",
      data: user,
    });
  },
);

export const usersController = {
  registerUser,
};