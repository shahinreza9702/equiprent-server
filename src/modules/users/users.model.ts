
import mongoose, { Schema } from "mongoose";

import type { IUser } from "./users.types.js";
import {
  USER_ROLES,
  USER_STATUSES,
} from "./users.types.js";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      trim: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent password from appearing in JSON responses
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const user = ret as unknown as Record<string, unknown>;

    delete user.password;

    return user;
  },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
