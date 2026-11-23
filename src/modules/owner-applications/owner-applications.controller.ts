import type { Request, Response, NextFunction } from "express";

import { ownerApplicationValidation } from "./owner-applications.validation.js";
import { ownerApplicationService } from "./owner-applications.service.js";
import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

const createApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validatedData =
      ownerApplicationValidation.createOwnerApplicationSchema.parse(req.body);

    const application = await ownerApplicationService.createApplication(
      req.user.userId,
      validatedData,
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Owner application submitted successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const application = await ownerApplicationService.getMyApplication(
      req.user.userId,
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Owner application retrieved successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const ownerApplicationController = {
  createApplication,
  getMyApplication,
};