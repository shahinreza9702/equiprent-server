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

// Get equipment details by ID
const getEquipmentById: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const equipmentId = req.params.id;

    if (typeof equipmentId !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid equipment ID",
      );
    }

    const equipment = await equipmentService.getEquipmentById(
      equipmentId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Equipment details retrieved successfully",
      data: equipment,
    });
  },
);

// Get owner's equipment
const getOwnerEquipments: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const result = await equipmentService.getOwnerEquipments(
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Your equipment retrieved successfully",
      data: result,
    });
  },
);

// Update owner's equipment
const updateEquipment: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const equipmentId = req.params.id;

    if (typeof equipmentId !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid equipment ID",
      );
    }

    const validationResult =
      equipmentValidation.updateEquipmentSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        message,
      );
    }

    const equipment = await equipmentService.updateEquipment(
      req.user.userId,
      equipmentId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Equipment updated successfully",
      data: equipment,
    });
  },
);

export const equipmentController = {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  getOwnerEquipments,
  updateEquipment,
};
