import mongoose from "mongoose";

import Payment from "./payment.model.js";
import getStripeClient from "./stripe.client.js";

import type {
  PaymentStatus,
  PaymentFulfillmentStatus,
} from "./payment.types.js";

import Equipment from "../equipment/equipment.model.js";
import Booking from "../bookings/booking.model.js";

import {
  calculateRentalDuration,
  calculateTotalAmount,
  type CreateBookingInput,
} from "../bookings/booking.service.js";

import { env } from "../../config/env.js";
import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

// Stripe uses different minor-unit exponents for some currencies.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf",
  "krw", "mga", "pyg", "rwf", "ugx", "vnd",
  "vuv", "xaf", "xof", "xpf",
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  "bhd", "jod", "kwd", "omr", "tnd",
]);

const convertToMinorUnits = (
  amount: number,
  currency: string,
): number => {
  const exponent = ZERO_DECIMAL_CURRENCIES.has(currency)
    ? 0
    : THREE_DECIMAL_CURRENCIES.has(currency)
      ? 3
      : 2;

  const minorAmount = Math.round(amount * 10 ** exponent);

  if (!Number.isSafeInteger(minorAmount) || minorAmount <= 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid payment amount",
    );
  }

  return minorAmount;
};

const getCheckoutUrls = () => {
  const baseUrl = env.CLIENT_URL.replace(/\/+$/, "");

  return {
    successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/payment/cancel`,
  };
};

// Create a Stripe Checkout Session for an authenticated customer.
const createCheckoutSession = async (
  customerId: string,
  payload: CreateBookingInput,
) => {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  if (!mongoose.isValidObjectId(payload.equipment)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid equipment ID",
    );
  }

  const currency = env.STRIPE_CURRENCY;

  if (!/^[a-z]{3}$/.test(currency)) {
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "Invalid payment currency configuration",
    );
  }

  const equipment = await Equipment.findById(payload.equipment);

  if (!equipment) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Equipment not found",
    );
  }

  if (
    equipment.approvalStatus !== "approved" ||
    equipment.status !== "available"
  ) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "This equipment is not available for booking",
    );
  }

  if (payload.quantity > equipment.availableQuantity) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Requested quantity is not available",
    );
  }

  const duration = calculateRentalDuration(
    payload.startDate,
    payload.endDate,
    equipment.rentalType,
  );

  // Check quantities reserved by already approved bookings
  // during the requested rental period.
  const overlappingBookings = await Booking.find({
    equipment: equipment._id,
    status: "approved",
    startDate: { $lt: payload.endDate },
    endDate: { $gt: payload.startDate },
  })
    .select("quantity")
    .lean();

  const reservedQuantity = overlappingBookings.reduce(
    (total, booking) => total + booking.quantity,
    0,
  );

  if (
    reservedQuantity + payload.quantity >
    equipment.availableQuantity
  ) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Not enough equipment quantity available for these dates",
    );
  }

  const totalAmount = calculateTotalAmount(
    equipment.rentalPrice,
    equipment.rentalType,
    payload.startDate,
    payload.endDate,
    duration,
    payload.quantity,
  );

  const amountInMinorUnits = convertToMinorUnits(
    totalAmount,
    currency,
  );

  // Save a payment snapshot before creating the Checkout Session.
  const payment = await Payment.create({
    customer: new mongoose.Types.ObjectId(customerId),
    owner: equipment.owner,
    equipment: equipment._id,
    bookingDetails: {
      startDate: payload.startDate,
      endDate: payload.endDate,
      duration,
      durationUnit: equipment.rentalType,
      quantity: payload.quantity,
      rentalPrice: equipment.rentalPrice,
      totalAmount,
      ...(payload.customerNote
        ? { customerNote: payload.customerNote }
        : {}),
    },
    amount: totalAmount,
    currency,
    status: "pending",
    fulfillmentStatus: "pending",
  });

  try {
    const stripe = getStripeClient();
    const { successUrl, cancelUrl } = getCheckoutUrls();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: payment._id.toString(),

      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountInMinorUnits,
            product_data: {
              name: equipment.name,
              description: `Equipment rental for ${duration} day(s)`,
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        paymentId: payment._id.toString(),
        customerId,
        equipmentId: equipment._id.toString(),
      },

      payment_intent_data: {
        metadata: {
          paymentId: payment._id.toString(),
        },
      },

      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL");
    }

    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        checkoutSessionId: session.id,
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: "failed",
      },
    });

    throw error;
  }
};

// Verify a Checkout Session for its authenticated customer.
const verifyCheckoutSession = async (
  customerId: string,
  sessionId: string,
): Promise<{
  sessionId: string;
  checkoutStatus: string | null;
  stripePaymentStatus: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: PaymentFulfillmentStatus;
  bookingId: string | null;
}> => {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  if (!sessionId.startsWith("cs_")) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid Checkout Session ID",
    );
  }

  const payment = await Payment.findOne({
    customer: customerId,
    checkoutSessionId: sessionId,
  });

  if (!payment) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Payment record not found",
    );
  }

  const stripe = getStripeClient();

  const checkoutSession =
    await stripe.checkout.sessions.retrieve(sessionId);

  if (
    checkoutSession.metadata?.paymentId !== payment._id.toString() ||
    checkoutSession.client_reference_id !== payment._id.toString()
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Checkout Session does not match payment record",
    );
  }

  // Read the latest database state after retrieving the Stripe session.
  const updatedPayment = await Payment.findById(payment._id);

  if (!updatedPayment) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Payment record not found",
    );
  }

  return {
    sessionId: checkoutSession.id,
    checkoutStatus: checkoutSession.status,
    stripePaymentStatus: checkoutSession.payment_status,
    paymentStatus: updatedPayment.status,
    fulfillmentStatus: updatedPayment.fulfillmentStatus,
    bookingId: updatedPayment.booking?.toString() ?? null,
  };
};

const paymentService = {
  createCheckoutSession,
  verifyCheckoutSession,
};

export default paymentService;
