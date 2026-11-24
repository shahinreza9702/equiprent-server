
import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import paymentService from "./payment.service.js";

// Verify a Stripe Checkout Session.
const verifyCheckoutSession: RequestHandler = asyncHandler(
  async (req, res) => {
    // Prevent browsers and proxies from caching payment status.
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

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
        "Invalid Checkout Session ID",
      );
    }

    const result = await paymentService.verifyCheckoutSession(
      req.user.userId,
      sessionId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Payment status retrieved successfully",
      data: result,
    });
  },
);

export const paymentVerificationController = {
  verifyCheckoutSession,
};
