import mongoose, { Schema } from "mongoose";

import type { IOwnerApplication } from "./owner-applications.types.js";
import { OWNER_APPLICATION_STATUSES } from "./owner-applications.types.js";

const ownerApplicationSchema = new Schema<IOwnerApplication>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },

    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      minlength: [2, "Business name must be at least 2 characters"],
      maxlength: [150, "Business name cannot exceed 150 characters"],
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Business address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    status: {
      type: String,
      enum: OWNER_APPLICATION_STATUSES,
      default: "pending",
    },

    reviewedBy: {
      type: String,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A user can have only one pending owner application.
// Only one pending application per user
ownerApplicationSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "unique_pending_owner_application_per_user",
  },
);

// Retrieve a user's application history
ownerApplicationSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "owner_application_user_history" },
);

// Retrieve applications by status for admin review
ownerApplicationSchema.index(
  { status: 1, createdAt: -1 },
  { name: "owner_application_status_createdAt" },
);

const OwnerApplication = mongoose.model<IOwnerApplication>(
  "OwnerApplication",
  ownerApplicationSchema,
);

export default OwnerApplication;