
import type { RequestHandler } from "express";

import ApiError from "../../utils/api-error.js";
import asyncHandler from "../../utils/async-handler.js";
import sendResponse from "../../utils/api-response.js";
import HTTP_STATUS from "../../constants/http-status.js";

import bookingService from "./booking.service.js";
import { bookingValidation } from "./booking.validation.js";

// Create booking
const createBooking: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      bookingValidation.createBookingSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const booking = await bookingService.createBooking(
      req.user.userId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Booking request created successfully",
      data: booking,
    });
  },
);

// Get customer's bookings
const getMyBookings: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      bookingValidation.ownerBookingQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const result = await bookingService.getCustomerBookings(
      req.user.userId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Your bookings retrieved successfully",
      data: result,
    });
  },
);

// Get owner's booking requests
const getOwnerBookings: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const validationResult =
      bookingValidation.bookingQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const result = await bookingService.getOwnerBookings(
      req.user.userId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Booking requests retrieved successfully",
      data: result,
    });
  },
);

// Get all bookings for admin
const getAllBookings: RequestHandler = asyncHandler(
  async (req, res) => {
    const validationResult =
      bookingValidation.bookingQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const result = await bookingService.getAllBookings(
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "All bookings retrieved successfully",
      data: result,
    });
  },
);

// Update booking status by owner
const updateBookingStatus: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const bookingId = req.params.id;

    if (typeof bookingId !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid booking ID",
      );
    }

    const validationResult =
      bookingValidation.updateBookingStatusSchema.safeParse(req.body);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const booking = await bookingService.updateBookingStatus(
      req.user.userId,
      bookingId,
      validationResult.data,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Booking status updated successfully",
      data: booking,
    });
  },
);

// Cancel customer's pending booking
const cancelBooking: RequestHandler = asyncHandler(
  async (req, res) => {
    if (!req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication required",
      );
    }

    const bookingId = req.params.id;

    if (typeof bookingId !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid booking ID",
      );
    }

    const booking = await bookingService.cancelBooking(
      req.user.userId,
      bookingId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Booking cancelled successfully",
      data: booking,
    });
  },
);

export const bookingController = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
};
