
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";

import Payment from "./payment.model.js";
import Booking from "../bookings/booking.model.js";
import Equipment from "../equipment/equipment.model.js";

import getStripeClient from "./stripe.client.js";

import type {
  PaymentRefundStatus,
} from "./payment.types.js";

// Stripe currency minor-unit conversion.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  "bhd",
  "jod",
  "kwd",
  "omr",
  "tnd",
]);

const toMinorUnits = (amount: number, currency: string) => {
  const exponent = ZERO_DECIMAL_CURRENCIES.has(currency)
    ? 0
    : THREE_DECIMAL_CURRENCIES.has(currency)
      ? 3
      : 2;

  return Math.round(amount * 10 ** exponent);
};

const getPaymentIntentId = (
  session: Stripe.Checkout.Session,
): string | undefined => {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id;
};

const getRefundPaymentIntentId = (
  refund: Stripe.Refund,
): string | undefined => {
  if (typeof refund.payment_intent === "string") {
    return refund.payment_intent;
  }

  return refund.payment_intent?.id;
};

const getValidRefundStatus = (
  status: string | null,
): PaymentRefundStatus => {
  const allowedStatuses: readonly PaymentRefundStatus[] = [
    "pending",
    "requires_action",
    "succeeded",
    "failed",
    "canceled",
  ];

  if (
    !status ||
    !allowedStatuses.includes(status as PaymentRefundStatus)
  ) {
    throw new Error("Unsupported Stripe refund status");
  }

  return status as PaymentRefundStatus;
};

// Refund a paid payment when its equipment can no longer be reserved.
const refundUnfulfillablePayment = async (
  paymentId: string,
  paymentIntentId: string,
) => {
  const stripe = getStripeClient();

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error("Payment record not found for refund");
  }

  // Retrieve an existing refund instead of creating another one.
  const refund = payment.refundId
    ? await stripe.refunds.retrieve(payment.refundId)
    : await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
        },
        {
          idempotencyKey: `equiprent-refund-${paymentId}`,
        },
      );

  const refundStatus = getValidRefundStatus(refund.status);

  await Payment.findOneAndUpdate(
    {
      _id: paymentId,
      status: "paid",
      fulfillmentStatus: "requires_refund",
    },
    {
      $set: {
        refundId: refund.id,
        refundStatus,
        ...(refundStatus === "succeeded"
          ? { status: "refunded" }
          : {}),
      },
    },
  );
};

// Handle a successfully completed Stripe Checkout Session.
const handleCheckoutSessionCompleted = async (
  checkoutSession: Stripe.Checkout.Session,
) => {
  if (checkoutSession.payment_status !== "paid") {
    return;
  }

  const paymentId = checkoutSession.metadata?.paymentId;

  if (!paymentId || !mongoose.isValidObjectId(paymentId)) {
    throw new Error("Invalid payment reference in Stripe metadata");
  }

  const payment = await Payment.findOne({
    _id: paymentId,
    $or: [
      { checkoutSessionId: checkoutSession.id },
      { checkoutSessionId: { $exists: false } },
    ],
  });

  if (!payment) {
    throw new Error("Payment record not found for Checkout Session");
  }

  if (
    payment.checkoutSessionId &&
    payment.checkoutSessionId !== checkoutSession.id
  ) {
    throw new Error("Checkout Session does not match payment record");
  }

  // Verify Stripe Checkout references against the saved payment record.
  if (
    checkoutSession.client_reference_id !== payment._id.toString() ||
    checkoutSession.metadata?.customerId !== payment.customer.toString() ||
    checkoutSession.metadata?.equipmentId !== payment.equipment.toString()
  ) {
    throw new Error("Stripe Checkout metadata does not match payment record");
  }

  const paymentIntentId = getPaymentIntentId(checkoutSession);

  // Verify the amount and currency against the saved payment snapshot.
  if (
    checkoutSession.currency !== payment.currency ||
    checkoutSession.amount_total !==
      toMinorUnits(payment.amount, payment.currency)
  ) {
    throw new Error("Stripe payment amount or currency mismatch");
  }

  // Idempotency: an already fulfilled payment must not create another booking.
  if (payment.status === "paid" && payment.booking) {
    return;
  }

  // Retry a refund if a previous refund attempt did not finish.
  if (
    payment.status === "paid" &&
    payment.fulfillmentStatus === "requires_refund"
  ) {
    if (!paymentIntentId) {
      throw new Error(
        "Payment Intent is missing; refund cannot be processed",
      );
    }

    await refundUnfulfillablePayment(
      payment._id.toString(),
      paymentIntentId,
    );

    return;
  }

  if (payment.status !== "pending") {
    return;
  }

  const dbSession = await mongoose.startSession();

  let requiresRefund = false;

  try {
    await dbSession.withTransaction(async () => {
      const currentPayment = await Payment.findById(payment._id)
        .session(dbSession);

      if (!currentPayment) {
        throw new Error("Payment record no longer exists");
      }

      // Another webhook delivery may already have fulfilled this payment.
      if (
        currentPayment.status === "paid" &&
        currentPayment.booking
      ) {
        return;
      }

      if (currentPayment.status !== "pending") {
        return;
      }

      // Incrementing this version serializes competing reservation transactions.
      const equipment = await Equipment.findOneAndUpdate(
        {
          _id: currentPayment.equipment,
          approvalStatus: "approved",
          status: "available",
        },
        {
          $inc: {
            bookingApprovalVersion: 1,
          },
        },
        {
          new: true,
          session: dbSession,
        },
      );

      if (!equipment) {
        currentPayment.status = "paid";
        currentPayment.fulfillmentStatus = "requires_refund";

        if (paymentIntentId) {
          currentPayment.paymentIntentId = paymentIntentId;
        }

        await currentPayment.save({ session: dbSession });

        requiresRefund = true;
        return;
      }

      const details = currentPayment.bookingDetails;

      // Approved bookings and already-paid pending bookings reserve quantity.
      const overlappingBookings = await Booking.find({
        equipment: equipment._id,
        startDate: { $lt: details.endDate },
        endDate: { $gt: details.startDate },
        $or: [
          { status: "approved" },
          { status: "pending", paymentStatus: "paid" },
        ],
      })
        .select("quantity")
        .session(dbSession)
        .lean();

      const reservedQuantity = overlappingBookings.reduce(
        (total, booking) => total + booking.quantity,
        0,
      );

      if (
        reservedQuantity + details.quantity >
        equipment.availableQuantity
      ) {
        currentPayment.status = "paid";
        currentPayment.fulfillmentStatus = "requires_refund";

        if (paymentIntentId) {
          currentPayment.paymentIntentId = paymentIntentId;
        }

        await currentPayment.save({ session: dbSession });

        requiresRefund = true;
        return;
      }

      const createdBookings = await Booking.create(
        [
          {
            bookingNumber: `ER-${randomUUID().slice(0, 8).toUpperCase()}`,
            customer: currentPayment.customer,
            owner: currentPayment.owner,
            equipment: currentPayment.equipment,
            startDate: details.startDate,
            endDate: details.endDate,
            duration: details.duration,
            durationUnit: details.durationUnit,
            quantity: details.quantity,
            rentalPrice: details.rentalPrice,
            totalAmount: details.totalAmount,
            ...(details.customerNote
              ? { customerNote: details.customerNote }
              : {}),
            status: "pending",
            paymentStatus: "paid",
          },
        ],
        { session: dbSession },
      );

      const booking = createdBookings[0];

      if (!booking) {
        throw new Error("Booking creation failed");
      }

      currentPayment.status = "paid";
      currentPayment.fulfillmentStatus = "fulfilled";
      currentPayment.booking = booking._id;

      if (paymentIntentId) {
        currentPayment.paymentIntentId = paymentIntentId;
      }

      await currentPayment.save({ session: dbSession });
    });

    if (requiresRefund) {
      if (!paymentIntentId) {
        throw new Error(
          "Payment Intent is missing; refund cannot be processed",
        );
      }

      await refundUnfulfillablePayment(
        payment._id.toString(),
        paymentIntentId,
      );
    }
  } finally {
    await dbSession.endSession();
  }
};

// Synchronize refund status updates from Stripe.
const handleRefundUpdated = async (
  refund: Stripe.Refund,
) => {
  const refundStatus = getValidRefundStatus(refund.status);

  const paymentIntentId = getRefundPaymentIntentId(refund);

  let payment: Awaited<ReturnType<typeof Payment.findOne>> = null;

  payment = await Payment.findOne({
    refundId: refund.id,
  });

  if (!payment && paymentIntentId) {
    payment = await Payment.findOne({
      paymentIntentId,
      fulfillmentStatus: "requires_refund",
    });
  }

  if (!payment) {
    return;
  }

  payment.refundId = refund.id;
  payment.refundStatus = refundStatus;

  if (refundStatus === "succeeded") {
    payment.status = "refunded";
  }

  await payment.save();
};

const paymentWebhookService = {
  handleCheckoutSessionCompleted,
  handleRefundUpdated,
};

export default paymentWebhookService;
