import mongoose from "mongoose";

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_FULFILLMENT_STATUSES = [
  "pending",
  "fulfilled",
  "requires_refund",
] as const;

export type PaymentFulfillmentStatus =
  (typeof PAYMENT_FULFILLMENT_STATUSES)[number];

export interface IPaymentBookingDetails {
  startDate: Date;
  endDate: Date;
  duration: number;
  durationUnit: "daily" | "weekly" | "monthly";
  quantity: number;
  rentalPrice: number;
  totalAmount: number;
  customerNote?: string;
}

export interface IPayment {
  customer: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;

  bookingDetails: IPaymentBookingDetails;

  amount: number;
  currency: string;

  status: PaymentStatus;
  fulfillmentStatus: PaymentFulfillmentStatus;

  checkoutSessionId?: string;
  paymentIntentId?: string;

  booking?: mongoose.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
