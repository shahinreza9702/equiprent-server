
import { z } from "zod";

import { OWNER_APPLICATION_STATUSES } from "../owner-applications/owner-applications.types.js";

import {
  USER_ROLES,
  USER_STATUSES,
} from "../users/users.types.js";

import {
  EQUIPMENT_APPROVAL_STATUSES,
  EQUIPMENT_STATUSES,
} from "../equipment/equipment.types.js";

const getUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateUserStatusSchema = z.object({
  status: z.enum(USER_STATUSES),
});

const reviewOwnerApplicationSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
  })
  .strict();

const reviewEquipmentSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
  })
  .strict();

const getOwnerApplicationsQuerySchema = z.object({
  status: z.enum(OWNER_APPLICATION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Admin equipment listing and filtering
const getEquipmentsQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),

    category: z.string().trim().min(2).max(100).optional(),

    location: z.string().trim().min(2).max(150).optional(),

    approvalStatus: z.enum(EQUIPMENT_APPROVAL_STATUSES).optional(),

    status: z.enum(EQUIPMENT_STATUSES).optional(),

    ownerId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid owner ID")
      .optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    sort: z
      .enum(["newest", "oldest", "price-asc", "price-desc"])
      .default("newest"),
  })
  .strict();

export const adminValidation = {
  getUsersQuerySchema,
  updateUserStatusSchema,
  reviewOwnerApplicationSchema,
  reviewEquipmentSchema,
  getOwnerApplicationsQuerySchema,
  getEquipmentsQuerySchema,
};
