
import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import paymentService from "./payment.service.js";
import { paymentValidation } from "./payment.validation.js";

// Create Stripe Checkout Session.
const createCheckoutSession: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      paymentValidation.createCheckoutSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const result = await paymentService.createCheckoutSession(
      req.user.userId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Checkout session created successfully",
      data: result,
    });
  },
);

// Verify a Stripe Checkout Session.
const verifyCheckoutSession: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const sessionId = req.params.sessionId;

    if (typeof sessionId !== "string" || !sessionId.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Checkout session ID is required",
      );
    }

    const result = await paymentService.verifyCheckoutSession(
      req.user.userId,
      sessionId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Checkout session verified successfully",
      data: result,
    });
  },
);

// Get earnings for the authenticated owner.
const getOwnerEarnings: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const result = await paymentService.getOwnerEarnings(
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Owner earnings retrieved successfully",
      data: result,
    });
  },
);

export const paymentController = {
  createCheckoutSession,
  verifyCheckoutSession,
  getOwnerEarnings,
};
