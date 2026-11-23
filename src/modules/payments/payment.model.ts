import mongoose, { Schema } from "mongoose";

import type { IPayment } from "./payment.types.js";

const bookingDetailsSchema = new Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    durationUnit: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    rentalPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    customerNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    _id: false,
  },
);

const paymentSchema = new Schema<IPayment>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    bookingDetails: {
      type: bookingDetailsSchema,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "fulfilled", "requires_refund"],
      default: "pending",
    },

    checkoutSessionId: {
      type: String,
      trim: true,
    },
    paymentIntentId: {
      type: String,
      trim: true,
    },

    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "payments",
  },
);

paymentSchema.index(
  { checkoutSessionId: 1 },
  { unique: true, sparse: true },
);

paymentSchema.index(
  { paymentIntentId: 1 },
  { unique: true, sparse: true },
);

paymentSchema.index(
  { booking: 1 },
  { unique: true, sparse: true },
);

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema,
);

export default Payment;
