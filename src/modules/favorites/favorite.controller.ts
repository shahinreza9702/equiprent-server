import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import favoriteService from "./favorite.service.js";
import { favoriteValidation } from "./favorite.validation.js";

// Get customer's favorites.
const getMyFavorites: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const result = await favoriteService.getMyFavorites(
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Your favorites retrieved successfully",
      data: result,
    });
  },
);

// Add equipment to favorites.
const addFavorite: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      favoriteValidation.equipmentIdParamsSchema.safeParse(
        req.params,
      );

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    const favorite = await favoriteService.addFavorite(
      req.user.userId,
      validationResult.data.equipmentId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Equipment added to favorites successfully",
      data: favorite,
    });
  },
);

// Remove equipment from favorites.
const removeFavorite: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      favoriteValidation.equipmentIdParamsSchema.safeParse(
        req.params,
      );

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    await favoriteService.removeFavorite(
      req.user.userId,
      validationResult.data.equipmentId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Equipment removed from favorites successfully",
    });
  },
);

export const favoriteController = {
  getMyFavorites,
  addFavorite,
  removeFavorite,
};