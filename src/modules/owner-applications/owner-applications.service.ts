import mongoose from "mongoose";

import OwnerApplication from "./owner-applications.model.js";
import type { IOwnerApplication } from "./owner-applications.types.js";
import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

const createApplication = async (
  userId: string,
  applicationData: Pick<
    IOwnerApplication,
    "businessName" | "contactNumber" | "address"
  >,
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
  }

  const existingApplication = await OwnerApplication.findOne({
    userId,
    status: "pending",
  });

  if (existingApplication) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "You already have a pending owner application",
    );
  }

  const application = await OwnerApplication.create({
    userId,
    ...applicationData,
    status: "pending",
  });

  return application;
};

const getMyApplication = async (userId: string) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
  }

  const application = await OwnerApplication.findOne({ userId }).sort({
    createdAt: -1,
  });

  return application;
};

export const ownerApplicationService = {
  createApplication,
  getMyApplication,
};