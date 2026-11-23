import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import { adminService } from "./admin.service.js";
import { adminValidation } from "./admin.validation.js";

const getOverview: RequestHandler = asyncHandler(async (_req, res) => {
  const result = await adminService.getOverview();

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: "Admin overview retrieved successfully",
    data: result,
  });
});

const getUsers: RequestHandler = asyncHandler(async (req, res) => {
  const validationResult =
    adminValidation.getUsersQuerySchema.safeParse(req.query);

  if (!validationResult.success) {
    const message = validationResult.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
  }

  const result = await adminService.getUsers(validationResult.data);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getOwnerApplications: RequestHandler = asyncHandler(
  async (req, res) => {
    const validationResult =
      adminValidation.getOwnerApplicationsQuerySchema.safeParse(
        req.query,
      );

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const result = await adminService.getOwnerApplications(
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Owner applications retrieved successfully",
      data: result,
    });
  },
);

const updateUserStatus: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      adminValidation.updateUserStatusSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const user = await adminService.updateUserStatus(
      req.params.id as string,
      req.user.userId,
      validationResult.data.status,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "User status updated successfully",
      data: user,
    });
  },
);

const reviewOwnerApplication: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      adminValidation.reviewOwnerApplicationSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const application = await adminService.reviewOwnerApplication(
      req.params.id as string,
      req.user.userId,
      validationResult.data.status,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: `Owner application ${validationResult.data.status} successfully`,
      data: application,
    });
  },
);

const reviewEquipment: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      adminValidation.reviewEquipmentSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const equipment = await adminService.reviewEquipment(
      req.params.id as string,
      req.user.userId,
      validationResult.data.status,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: `Equipment ${validationResult.data.status} successfully`,
      data: equipment,
    });
  },
);


const getEquipments: RequestHandler = asyncHandler(async (req, res) => {
  const validationResult =
    adminValidation.getEquipmentsQuerySchema.safeParse(req.query);

  if (!validationResult.success) {
    const message = validationResult.error.issues
      .map((issue) => issue.message)
      .join(", ");

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
  }

  const result = await adminService.getEquipments(
    validationResult.data,
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    message: "Equipment retrieved successfully",
    data: result,
  });
});

export const adminController = {
  getOverview,
  getUsers,
  getOwnerApplications,
  updateUserStatus,
  reviewOwnerApplication,
  getEquipments,
  reviewEquipment,
};
