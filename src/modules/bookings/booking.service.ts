
import mongoose, { type QueryFilter } from "mongoose";
import { randomUUID } from "node:crypto";

import type { IBooking } from "./booking.types.js";
import Booking from "./booking.model.js";

import Equipment from "../equipment/equipment.model.js";
import type { IEquipment } from "../equipment/equipment.types.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Calculate rental duration in total days for every rental type.
export const calculateRentalDuration = (
  startDate: Date,
  endDate: Date,
  rentalType: IEquipment["rentalType"],
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "End date must be after start date",
    );
  }

  const isStartAtMidnightUTC =
    start.getUTCHours() === 0 &&
    start.getUTCMinutes() === 0 &&
    start.getUTCSeconds() === 0 &&
    start.getUTCMilliseconds() === 0;

  const isEndAtMidnightUTC =
    end.getUTCHours() === 0 &&
    end.getUTCMinutes() === 0 &&
    end.getUTCSeconds() === 0 &&
    end.getUTCMilliseconds() === 0;

  if (!isStartAtMidnightUTC || !isEndAtMidnightUTC) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Booking dates must be at midnight UTC",
    );
  }

  const durationInDays =
    (end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY;

  // Weekly rentals must use complete 7-day periods.
  if (rentalType === "weekly" && durationInDays % 7 !== 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Weekly rentals must use complete 7-day periods",
    );
  }

  return durationInDays;
};

// Calculate monthly rental amount using actual calendar-month days.
const calculateMonthlyAmount = (
  monthlyPrice: number,
  startDate: Date,
  endDate: Date,
): number => {
  let cursor = new Date(startDate);
  let amount = 0;

  while (cursor < endDate) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    const nextMonth = new Date(Date.UTC(year, month + 1, 1));

    const segmentEnd = nextMonth < endDate ? nextMonth : endDate;

    const usedDays =
      (segmentEnd.getTime() - cursor.getTime()) /
      MILLISECONDS_PER_DAY;

    const daysInMonth = new Date(
      Date.UTC(year, month + 1, 0),
    ).getUTCDate();

    amount += monthlyPrice * (usedDays / daysInMonth);

    cursor = segmentEnd;
  }

  return amount;
};

// Calculate total rental amount based on rental type.
export const calculateTotalAmount = (
  rentalPrice: number,
  rentalType: IEquipment["rentalType"],
  startDate: Date,
  endDate: Date,
  durationInDays: number,
  quantity: number,
): number => {
  if (
    !Number.isFinite(rentalPrice) ||
    rentalPrice <= 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid rental price or quantity",
    );
  }

  let baseAmount: number;

  if (rentalType === "daily") {
    baseAmount = rentalPrice * durationInDays;
  } else if (rentalType === "weekly") {
    baseAmount = rentalPrice * (durationInDays / 7);
  } else {
    baseAmount = calculateMonthlyAmount(
      rentalPrice,
      startDate,
      endDate,
    );
  }

  const totalAmount = baseAmount * quantity;

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid booking amount",
    );
  }

  return Number(totalAmount.toFixed(2));
}

export interface CreateBookingInput {
  equipment: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
  customerNote?: string | undefined;
}

interface BookingQuery {
  page?: number;
  limit?: number;
  status?: IBooking["status"] | undefined;
}

interface OwnerBookingQuery extends BookingQuery {
  equipment?: string;
}

interface UpdateBookingStatusInput {
  status: "approved" | "rejected" | "completed";
  ownerResponse?: string | undefined;
}

// Create a new booking.
const createBooking = async (
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

  const totalAmount = calculateTotalAmount(
    equipment.rentalPrice,
    equipment.rentalType,
    payload.startDate,
    payload.endDate,
    duration,
    payload.quantity,
  );

  const booking = await Booking.create({
    bookingNumber: `ER-${randomUUID().slice(0, 8).toUpperCase()}`,
    customer: new mongoose.Types.ObjectId(customerId),
    owner: equipment.owner,
    equipment: equipment._id,
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
    status: "pending",
    paymentStatus: "pending",
  });

  return booking;
};

// Get bookings belonging to a customer.
const getCustomerBookings = async (
  customerId: string,
  query: BookingQuery = {},
) => {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 10));
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IBooking> = {
    customer: new mongoose.Types.ObjectId(customerId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("equipment", "name image category location rentalType")
      .populate("owner", "name email phone avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get booking requests belonging to an equipment owner.
const getOwnerBookings = async (
  ownerId: string,
  query: OwnerBookingQuery = {},
) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 10));
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IBooking> = {
    owner: new mongoose.Types.ObjectId(ownerId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.equipment) {
    if (!mongoose.isValidObjectId(query.equipment)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid equipment ID",
      );
    }

    filter.equipment = new mongoose.Types.ObjectId(query.equipment);
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("equipment", "name image category location rentalType")
      .populate("customer", "name email phone avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Update booking status with transaction safety.
const updateBookingStatus = async (
  ownerId: string,
  bookingId: string,
  payload: UpdateBookingStatusInput,
) => {
  if (
    !mongoose.isValidObjectId(ownerId) ||
    !mongoose.isValidObjectId(bookingId)
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid owner or booking ID",
    );
  }

  const session = await mongoose.startSession();

  try {
    let updatedBooking = null;

    await session.withTransaction(async () => {
      const booking = await Booking.findOne({
        _id: bookingId,
        owner: ownerId,
      }).session(session);

      if (!booking) {
        throw new ApiError(
          HTTP_STATUS.NOT_FOUND,
          "Booking not found",
        );
      }

      if (
        booking.status !== "pending" &&
        payload.status !== "completed"
      ) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          "Only pending bookings can be approved or rejected",
        );
      }

      // Only paid bookings can be processed by the equipment owner.
      if (booking.paymentStatus !== "paid") {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          "Booking payment has not been completed",
        );
      }

      // Do not reject paid bookings until refund processing is available.
      if (payload.status === "rejected") {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          "Paid bookings cannot be rejected until refund processing is available",
        );
      }

      if (
        payload.status === "completed" &&
        booking.status !== "approved"
      ) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          "Only approved bookings can be completed",
        );
      }

      if (payload.status === "approved") {
        const equipment = await Equipment.findOneAndUpdate(
          {
            _id: booking.equipment,
            owner: ownerId,
            approvalStatus: "approved",
            status: "available",
          },
          {
            $inc: { bookingApprovalVersion: 1 },
          },
          {
            new: true,
            session,
          },
        );

        if (!equipment) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            "Equipment is no longer available",
          );
        }

        const overlappingBookings = await Booking.find({
          _id: { $ne: booking._id },
          equipment: booking.equipment,
          $or: [
            { status: "approved" },
            {
              status: "pending",
              paymentStatus: "paid",
            },
          ],
          startDate: { $lt: booking.endDate },
          endDate: { $gt: booking.startDate },
        })
          .session(session)
          .lean();

        const reservedQuantity = overlappingBookings.reduce(
          (total, item) => total + item.quantity,
          0,
        );

        if (
          reservedQuantity + booking.quantity >
          equipment.availableQuantity
        ) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            "Not enough equipment quantity available for these dates",
          );
        }
      }

      booking.status = payload.status;

      if (payload.ownerResponse !== undefined) {
        booking.ownerResponse = payload.ownerResponse;
      }

      await booking.save({ session });

      updatedBooking = booking;
    });

    return updatedBooking;
  } finally {
    await session.endSession();
  }
};

// Cancel a pending booking.
const cancelBooking = async (
  customerId: string,
  bookingId: string,
) => {
  if (
    !mongoose.isValidObjectId(customerId) ||
    !mongoose.isValidObjectId(bookingId)
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid customer or booking ID",
    );
  }

  const booking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      customer: customerId,
      status: "pending",
      paymentStatus: "pending",
    },
    {
      $set: {
        status: "cancelled",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!booking) {
    const existingPaidBooking = await Booking.exists({
      _id: bookingId,
      customer: customerId,
      paymentStatus: "paid",
    });

    if (existingPaidBooking) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "Paid bookings cannot be cancelled until refund processing is available",
      );
    }

    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Only pending bookings can be cancelled",
    );
  }

  return booking;
};

// Get all bookings for admin.
const getAllBookings = async (
  query: BookingQuery = {},
) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 10));
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IBooking> = {};

  if (query.status) {
    filter.status = query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("equipment", "name image category location")
      .populate("customer", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const bookingService = {
  createBooking,
  getCustomerBookings,
  getOwnerBookings,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
};

export default bookingService;
