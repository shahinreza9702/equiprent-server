import mongoose, { Schema } from "mongoose";

import type { IBooking } from "./booking.types.js";

import {
  BOOKING_STATUSES,
  BOOKING_PAYMENT_STATUSES,
} from "./booking.types.js";

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      required: [true, "Booking number is required"],
      unique: true,
      trim: true,
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: [true, "Equipment is required"],
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],

    },

    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Duration must be a whole number",
      },
    },

    durationUnit: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: [true, "Duration unit is required"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    rentalPrice: {
      type: Number,
      required: [true, "Rental price is required"],
      min: [0.01, "Rental price must be greater than 0"],
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0.01, "Total amount must be greater than 0"],
    },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: BOOKING_PAYMENT_STATUSES,
      default: "pending",
    },

    customerNote: {
      type: String,
      trim: true,
      maxlength: [500, "Customer note cannot exceed 500 characters"],
    },

    ownerResponse: {
      type: String,
      trim: true,
      maxlength: [500, "Owner response cannot exceed 500 characters"],
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "bookings",
  },
);

const Booking = mongoose.model<IBooking>(
  "Booking",
  bookingSchema,
);

export default Booking;


