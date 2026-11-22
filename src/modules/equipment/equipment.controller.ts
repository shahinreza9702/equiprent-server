import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import { equipmentService } from "./equipment.service.js";
import { equipmentValidation } from "./equipment.validation.js";

// Create equipment
const createEquipment: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      equipmentValidation.createEquipmentSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    const equipment = await equipmentService.createEquipment(
      req.user.userId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Equipment created successfully",
      data: equipment,
    });
  },
);

// Get all available equipment
const getAllEquipment: RequestHandler = asyncHandler(
  async (req, res) => {
    const validationResult =
      equipmentValidation.equipmentQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    const result = await equipmentService.getAllEquipment(
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Equipment retrieved successfully",
      data: result,
    });
  },
);

export const equipmentController = {
  createEquipment,
  getAllEquipment,
};
