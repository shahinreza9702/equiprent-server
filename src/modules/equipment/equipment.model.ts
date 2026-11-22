
import mongoose, { Schema } from "mongoose";

import type { IEquipment } from "./equipment.types.js";

import {
  EQUIPMENT_RENTAL_TYPES,
  EQUIPMENT_STATUSES,
  EQUIPMENT_APPROVAL_STATUSES,
} from "./equipment.types.js";

const equipmentSchema = new Schema<IEquipment>(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
      minlength: [2, "Equipment name must be at least 2 characters"],
      maxlength: [150, "Equipment name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Equipment description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },

    category: {
      type: String,
      required: [true, "Equipment category is required"],
      trim: true,
    },

    rentalPrice: {
      type: Number,
      required: [true, "Rental price is required"],
      min: [0.01, "Rental price must be greater than 0"],
    },

    rentalType: {
      type: String,
      enum: EQUIPMENT_RENTAL_TYPES,
      required: [true, "Rental type is required"],
    },

    location: {
      type: String,
      required: [true, "Equipment location is required"],
      trim: true,
    },

    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Available quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Available quantity must be a whole number",
      },
    },

    condition: {
      type: String,
      required: [true, "Equipment condition is required"],
      trim: true,
    },

    brand: {
      type: String,
      required: [true, "Equipment brand is required"],
      trim: true,
    },

    model: {
      type: String,
      required: [true, "Equipment model is required"],
      trim: true,
    },

    image: {
      type: String,
      required: [true, "Equipment image is required"],
      trim: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Equipment owner is required"],
    },

    rentalTerms: {
      type: String,
      required: [true, "Rental terms are required"],
      trim: true,
    },

    status: {
      type: String,
      enum: EQUIPMENT_STATUSES,
      default: "available",
    },

    approvalStatus: {
      type: String,
      enum: EQUIPMENT_APPROVAL_STATUSES,
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "equipments",
  },
);

const Equipment = mongoose.model<IEquipment>(
  "Equipment",
  equipmentSchema,
);

export default Equipment;
