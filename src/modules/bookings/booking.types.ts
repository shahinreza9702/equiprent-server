import mongoose from "mongoose";

export const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
] as const;

export type BookingStatus =
  (typeof BOOKING_STATUSES)[number];

export const BOOKING_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "refunded",
] as const;

export type BookingPaymentStatus =
  (typeof BOOKING_PAYMENT_STATUSES)[number];

export interface IBooking {
  bookingNumber: string;

  customer: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;

  startDate: Date;
  endDate: Date;

  duration: number;
  durationUnit: "daily" | "weekly" | "monthly";

  quantity: number;

  rentalPrice: number;
  totalAmount: number;

  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;

  customerNote?: string;
  ownerResponse?: string;

  requestedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
