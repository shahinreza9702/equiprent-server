
import { Router } from "express";

import { bookingController } from "./booking.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

const router = Router();

// Customer: Get own bookings
router.get(
  "/my-bookings",
  authMiddleware,
  authorizeRoles("customer"),
  bookingController.getMyBookings,
);

// Owner: Get booking requests for own equipment
router.get(
  "/owner",
  authMiddleware,
  authorizeRoles("owner"),
  bookingController.getOwnerBookings,
);

// Admin: Get all bookings
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  bookingController.getAllBookings,
);

// Owner: Approve, reject, or complete a booking
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("owner"),
  bookingController.updateBookingStatus,
);

// Customer: Cancel own pending booking
router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("customer"),
  bookingController.cancelBooking,
);

export default router;
