import { isValidObjectId } from "mongoose";
import Booking from "../bookings/booking.model.js";
import mongoose from "mongoose";
import OwnerApplication from "../owner-applications/owner-applications.model.js";
import type { OwnerApplicationStatus } from "../owner-applications/owner-applications.types.js";

import Equipment from "../equipment/equipment.model.js";
import type { EquipmentApprovalStatus, EquipmentStatus } from "../equipment/equipment.types.js";

import User from "../users/users.model.js";
import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

interface GetUsersInput {
  search?: string | undefined;
  role?: "customer" | "owner" | "admin" | undefined;
  status?: "active" | "blocked" | undefined;
  page: number;
  limit: number;
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUsers = async (query: GetUsersInput) => {
  const filter: Record<string, unknown> = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const search = escapeRegex(query.search);

    const searchConditions: Record<string, unknown>[] = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    if (isValidObjectId(query.search)) {
      searchConditions.push({ _id: query.search });
    }

    filter.$or = searchConditions;
  }

  const skip = (query.page - 1) * query.limit;

  const [users, totalUsers, totalCount, customerCount, ownerCount, adminCount, activeCount] =
    await Promise.all([
      User.find(filter)
        .select("name email phone role status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),

      User.countDocuments(filter),
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ status: "active" }),
    ]);

  return {
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      status: user.status,
      joinedDate: user.createdAt,
    })),
    stats: {
      totalUsers: totalCount,
      customers: customerCount,
      owners: ownerCount,
      admins: adminCount,
      activeUsers: activeCount,
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / query.limit),
    },
  };
};

const updateUserStatus = async (
  targetUserId: string,
  adminUserId: string,
  status: "active" | "blocked",
) => {
  if (!isValidObjectId(targetUserId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid user ID",
    );
  }

  if (targetUserId === adminUserId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "You cannot change your own account status",
    );
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "User not found",
    );
  }

  user.status = status;
  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
};

interface GetEquipmentsInput {
  search?: string | undefined;
  category?: string | undefined;
  location?: string | undefined;
  approvalStatus?: EquipmentApprovalStatus | undefined;
  status?: EquipmentStatus | undefined;
  ownerId?: string | undefined;
  page: number;
  limit: number;
  sort: "newest" | "oldest" | "price-asc" | "price-desc";
}

interface GetOwnerApplicationsInput {
  status?: OwnerApplicationStatus | undefined;
  page: number;
  limit: number;
}

const getOwnerApplications = async (
  query: GetOwnerApplicationsInput,
) => {
  const filter: Record<string, unknown> = {};

  if (query.status) {
    filter.status = query.status;
  }

  const skip = (query.page - 1) * query.limit;

  const [
    applications,
    totalApplications,
    totalCount,
    pendingCount,
    approvedCount,
    rejectedCount,
  ] = await Promise.all([
    OwnerApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),

    OwnerApplication.countDocuments(filter),
    OwnerApplication.countDocuments(),
    OwnerApplication.countDocuments({ status: "pending" }),
    OwnerApplication.countDocuments({ status: "approved" }),
    OwnerApplication.countDocuments({ status: "rejected" }),
  ]);

  const userIds = applications.map(
    (application) => application.userId,
  );

  const users = await User.find({
    _id: { $in: userIds },
  })
    .select("name email phone")
    .lean();

  const userMap = new Map(
    users.map((user) => [user._id.toString(), user]),
  );

  return {
    applications: applications.map((application) => {
      const applicant = userMap.get(application.userId);

      return {
        id: application._id.toString(),
        userId: application.userId,
        applicant: applicant
          ? {
              name: applicant.name,
              email: applicant.email,
              phone: applicant.phone ?? null,
            }
          : null,
        businessName: application.businessName,
        contactNumber: application.contactNumber,
        address: application.address,
        status: application.status,
        reviewedBy: application.reviewedBy ?? null,
        reviewedAt: application.reviewedAt ?? null,
        submittedAt: application.createdAt,
      };
    }),

    stats: {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },

    pagination: {
      page: query.page,
      limit: query.limit,
      totalApplications,
      totalPages: Math.ceil(totalApplications / query.limit),
    },
  };
};


const getEquipments = async (query: GetEquipmentsInput) => {
  const filter: Record<string, unknown> = {};

  if (query.approvalStatus) {
    filter.approvalStatus = query.approvalStatus;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = {
      $regex: `^${escapeRegex(query.category)}$`,
      $options: "i",
    };
  }

  if (query.location) {
    filter.location = {
      $regex: escapeRegex(query.location),
      $options: "i",
    };
  }

  if (query.ownerId) {
    filter.owner = new mongoose.Types.ObjectId(query.ownerId);
  }

  if (query.search) {
    const search = escapeRegex(query.search);

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-asc": { rentalPrice: 1 },
    "price-desc": { rentalPrice: -1 },
  } as const;

  const skip = (query.page - 1) * query.limit;

  const [
    equipments,
    totalEquipments,
    totalCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    availableCount,
    unavailableCount,
  ] = await Promise.all([
    Equipment.find(filter)
      .populate("owner", "name email phone")
      .sort(sortOptions[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),

    Equipment.countDocuments(filter),
    Equipment.countDocuments(),
    Equipment.countDocuments({ approvalStatus: "pending" }),
    Equipment.countDocuments({ approvalStatus: "approved" }),
    Equipment.countDocuments({ approvalStatus: "rejected" }),
    Equipment.countDocuments({ status: "available" }),
    Equipment.countDocuments({ status: "unavailable" }),
  ]);

  return {
    equipments: equipments.map((equipment) => ({
      ...equipment,
      id: equipment._id.toString(),
    })),

    stats: {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      available: availableCount,
      unavailable: unavailableCount,
    },

    pagination: {
      page: query.page,
      limit: query.limit,
      totalEquipments,
      totalPages: Math.ceil(totalEquipments / query.limit),
    },
  };
};


const getOverview = async () => {
  const now = new Date();

  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const sixMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );

  const confirmedBookingFilter = {
    status: { $in: ["approved", "completed"] },
  };

  const [
    totalUsers,
    totalEquipment,
    totalBookings,
    pendingEquipment,
    pendingBookings,
    confirmedBookingValue,
    recentUsers,
    pendingEquipmentList,
    monthlyBookingResults,
  ] = await Promise.all([
    User.countDocuments(),

    Equipment.countDocuments(),

    Booking.countDocuments(),

    Equipment.countDocuments({ approvalStatus: "pending" }),

    Booking.countDocuments({ status: "pending" }),

    Booking.aggregate([
      { $match: confirmedBookingFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]),

    User.find()
      .select("name email role status createdAt")
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),

    Equipment.find({ approvalStatus: "pending" })
      .select("name category location image createdAt owner")
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),

    Booking.aggregate([
      {
        $match: {
          ...confirmedBookingFilter,
          createdAt: {
            $gte: sixMonthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
            },
          },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Fill missing months with zero values.
  const monthlyBookingValue = Array.from(
    { length: 6 },
    (_, index) => {
      const monthDate = new Date(
        Date.UTC(
          sixMonthStart.getUTCFullYear(),
          sixMonthStart.getUTCMonth() + index,
          1,
        ),
      );

      const monthKey = [
        monthDate.getUTCFullYear(),
        String(monthDate.getUTCMonth() + 1).padStart(2, "0"),
      ].join("-");

      const result = monthlyBookingResults.find(
        (item) => item._id === monthKey,
      );

      return {
        month: monthKey,
        value: result?.total ?? 0,
      };
    },
  );

  return {
    stats: {
      totalUsers,
      totalEquipment,
      totalBookings,
      pendingEquipment,
      pendingBookings,
      confirmedBookingValue:
        confirmedBookingValue[0]?.total ?? 0,
    },

    monthlyBookingValue,

    recentUsers: recentUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    })),

    pendingEquipments: pendingEquipmentList.map((equipment) => {
      const owner = equipment.owner as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        email: string;
      } | null;

      return {
        id: equipment._id.toString(),
        name: equipment.name,
        category: equipment.category,
        location: equipment.location,
        image: equipment.image,
        createdAt: equipment.createdAt,
        owner: owner
          ? {
              id: owner._id.toString(),
              name: owner.name,
              email: owner.email,
            }
          : null,
      };
    }),
  };
};


const reviewEquipment = async (
  equipmentId: string,
  adminUserId: string,
  status: Extract<EquipmentApprovalStatus, "approved" | "rejected">,
) => {
  if (!isValidObjectId(equipmentId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid equipment ID",
    );
  }

  if (!isValidObjectId(adminUserId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid admin user ID",
    );
  }

  const equipment = await Equipment.findOneAndUpdate(
    {
      _id: equipmentId,
      approvalStatus: "pending",
    },
    {
      $set: {
        approvalStatus: status,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!equipment) {
    const existingEquipment = await Equipment.findById(equipmentId)
      .select("_id approvalStatus")
      .lean();

    if (!existingEquipment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Equipment not found",
      );
    }

    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Only pending equipment can be reviewed. Rejected equipment must be resubmitted by its owner.",
    );
  }

  return {
    id: equipment._id.toString(),
    name: equipment.name,
    approvalStatus: equipment.approvalStatus,
    reviewedBy: equipment.reviewedBy ?? null,
    reviewedAt: equipment.reviewedAt ?? null,
  };
};

const reviewOwnerApplication = async (
  applicationId: string,
  adminUserId: string,
  status: Extract<OwnerApplicationStatus, "approved" | "rejected">,
) => {
  if (!isValidObjectId(applicationId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid owner application ID",
    );
  }

  if (!isValidObjectId(adminUserId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid admin user ID",
    );
  }

  const session = await mongoose.startSession();

  try {
    let result: Record<string, unknown> | null = null;

    await session.withTransaction(async () => {
      const application = await OwnerApplication.findOne({
        _id: applicationId,
        status: "pending",
      }).session(session);

      if (!application) {
        throw new ApiError(
          HTTP_STATUS.NOT_FOUND,
          "Pending owner application not found",
        );
      }

      const user = await User.findById(application.userId).session(session);

      if (!user || user.role !== "customer") {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          "Applicant is no longer eligible for owner approval",
        );
      }

      if (status === "approved") {
        user.role = "owner";
        await user.save({ session });
      }

      application.status = status;
      application.reviewedBy = adminUserId;
      application.reviewedAt = new Date();

      await application.save({ session });

      result = {
        id: application._id.toString(),
        userId: application.userId,
        businessName: application.businessName,
        status: application.status,
        reviewedBy: application.reviewedBy,
        reviewedAt: application.reviewedAt,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const adminService = {
  getOverview,
  getUsers,
  updateUserStatus,
  reviewOwnerApplication,
  reviewEquipment,
  getOwnerApplications,
  getEquipments,
};

