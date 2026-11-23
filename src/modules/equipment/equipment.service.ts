
import mongoose, { type QueryFilter } from "mongoose";

import Equipment from "./equipment.model.js";
import User from "../users/users.model.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

import type { IEquipment } from "./equipment.types.js";

// Create equipment payload
interface CreateEquipmentInput {
  name: string;
  description: string;
  category: string;
  rentalPrice: number;
  rentalType: IEquipment["rentalType"];
  location: string;
  availableQuantity: number;
  condition: string;
  brand: string;
  model: string;
  image: string;
  rentalTerms: string;
}

// Equipment listing query parameters
interface EquipmentQuery {
  page?: number;
  limit?: number;
  search?: string | undefined;
  category?: string | undefined;
  location?: string | undefined;
  rentalType?: IEquipment["rentalType"] | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sort?: "newest" | "price-asc" | "price-desc" | undefined;
}

// Create equipment
const createEquipment = async (
  ownerId: string,
  payload: CreateEquipmentInput,
) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  const owner = await User.findById(ownerId).select("_id role status");

  if (!owner || owner.role !== "owner" || owner.status !== "active") {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Only active equipment owners can create equipment",
    );
  }

  const equipment = await Equipment.create({
    ...payload,
    owner: owner._id,
    approvalStatus: "pending",
  });

  return equipment;
};

// Get all approved and available equipment
const getAllEquipment = async (query: EquipmentQuery = {}) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 12));
  const skip = (page - 1) * limit;

  const sortOptions = {
    newest: { createdAt: -1 },
    "price-asc": { rentalPrice: 1 },
    "price-desc": { rentalPrice: -1 },
  } as const;

  const sort = sortOptions[query.sort ?? "newest"];

  const matchFilter: QueryFilter<IEquipment> = {
    approvalStatus: "approved",
    status: "available",
    availableQuantity: { $gt: 0 },
  };

  // Search by equipment name
  if (query.search?.trim()) {
    matchFilter.name = {
      $regex: query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  // Filter by category
  if (query.category?.trim()) {
    matchFilter.category = {
      $regex: `^${query.category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    };
  }

  // Filter by location
  if (query.location?.trim()) {
    matchFilter.location = {
      $regex: query.location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  // Filter by rental type
  if (query.rentalType) {
    matchFilter.rentalType = query.rentalType;
  }

  // Filter by price range
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    matchFilter.rentalPrice = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }

  const result = await Equipment.aggregate([
    {
      $match: matchFilter,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $match: {
        "owner.role": "owner",
        "owner.status": "active",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        category: 1,
        rentalPrice: 1,
        rentalType: 1,
        location: 1,
        availableQuantity: 1,
        condition: 1,
        brand: 1,
        model: 1,
        image: 1,
        rentalTerms: 1,
        status: 1,
        approvalStatus: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: {
          _id: "$owner._id",
          name: "$owner.name",
          email: "$owner.email",
          phone: "$owner.phone",
          avatar: "$owner.avatar",
        },
      },
    },
    { $sort: sort },
    {
      $facet: {
        equipments: [
          { $skip: skip },
          { $limit: limit },
        ],
        metadata: [
          { $count: "total" },
        ],
      },
    },
  ]);

  const equipments = result[0]?.equipments ?? [];
  const total = result[0]?.metadata[0]?.total ?? 0;

  return {
    equipments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get equipment details by ID
const getEquipmentById = async (equipmentId: string) => {
  if (!mongoose.isValidObjectId(equipmentId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid equipment ID",
    );
  }

  const equipment = await Equipment.findOne({
    _id: equipmentId,
    approvalStatus: "approved",
  }).populate({
    path: "owner",
    select: "name email phone avatar role status",
  });

  if (
    !equipment ||
    !equipment.owner ||
    typeof equipment.owner === "string"
  ) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Equipment not found",
    );
  }

  const owner = equipment.owner as unknown as {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
    status: string;
  };

  if (owner.role !== "owner" || owner.status !== "active") {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Equipment not found",
    );
  }

  return equipment;
};

// Get all equipment belonging to an owner
const getOwnerEquipments = async (
  ownerId: string,
  query: EquipmentQuery = {},
) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 12));
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IEquipment> = {
    owner: new mongoose.Types.ObjectId(ownerId),
  };

  const [equipments, total] = await Promise.all([
    Equipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Equipment.countDocuments(filter),
  ]);

  return {
    equipments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get owner's equipment dashboard summary
const getOwnerDashboardSummary = async (ownerId: string) => {
  if (!mongoose.isValidObjectId(ownerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }

  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  const [summary] = await Equipment.aggregate([
    {
      $match: {
        owner: ownerObjectId,
      },
    },
    {
      $group: {
        _id: null,

        totalEquipment: {
          $sum: 1,
        },

        approvedEquipment: {
          $sum: {
            $cond: [{ $eq: ["$approvalStatus", "approved"] }, 1, 0],
          },
        },

        pendingEquipment: {
          $sum: {
            $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0],
          },
        },

        rejectedEquipment: {
          $sum: {
            $cond: [{ $eq: ["$approvalStatus", "rejected"] }, 1, 0],
          },
        },

        availableEquipment: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "available"] },
                  { $gt: ["$availableQuantity", 0] },
                ],
              },
              1,
              0,
            ],
          },
        },

        unavailableEquipment: {
          $sum: {
            $cond: [{ $eq: ["$status", "unavailable"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalEquipment: 1,
        approvedEquipment: 1,
        pendingEquipment: 1,
        rejectedEquipment: 1,
        availableEquipment: 1,
        unavailableEquipment: 1,
      },
    },
  ]);

  return (
    summary ?? {
      totalEquipment: 0,
      approvedEquipment: 0,
      pendingEquipment: 0,
      rejectedEquipment: 0,
      availableEquipment: 0,
      unavailableEquipment: 0,
    }
  );
};

// Update equipment
const updateEquipment = async (
  ownerId: string,
  equipmentId: string,
  payload: {
    [K in keyof CreateEquipmentInput]?: CreateEquipmentInput[K] | undefined;
  },
) => {
  if (
    !mongoose.isValidObjectId(ownerId) ||
    !mongoose.isValidObjectId(equipmentId)
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid owner or equipment ID",
    );
  }

  const owner = await User.findOne({
    _id: ownerId,
    role: "owner",
    status: "active",
  }).select("_id");

  if (!owner) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Only active equipment owners can update equipment",
    );
  }

  const equipment = await Equipment.findOne({
    _id: equipmentId,
    owner: owner._id,
  });

  if (!equipment) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Equipment not found",
    );
  }

  Object.assign(equipment, payload);

  equipment.approvalStatus = "pending";
  equipment.set("reviewedBy", undefined);
  equipment.set("reviewedAt", undefined);

  await equipment.save();

  return equipment;
};

// Delete owner's equipment
const deleteEquipment = async (
  ownerId: string,
  equipmentId: string,
) => {
  if (
    !mongoose.isValidObjectId(ownerId) ||
    !mongoose.isValidObjectId(equipmentId)
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid owner or equipment ID",
    );
  }

  const owner = await User.findOne({
    _id: ownerId,
    role: "owner",
    status: "active",
  }).select("_id");

  if (!owner) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Only active equipment owners can delete equipment",
    );
  }

  const equipment = await Equipment.findOneAndDelete({
    _id: equipmentId,
    owner: owner._id,
  });

  if (!equipment) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Equipment not found",
    );
  }

  return equipment;
};

// Export equipment services
export const equipmentService = {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  getOwnerEquipments,
  getOwnerDashboardSummary,
  updateEquipment,
  deleteEquipment,
};