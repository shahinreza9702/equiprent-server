import bcrypt from "bcryptjs";

import User from "./users.model.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

import type { UserRole } from "./users.types.js";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string | undefined;
  avatar?: string | undefined;
}

const registerUser = async (payload: RegisterUserInput) => {
  const email = payload.email.toLowerCase().trim();

  // Validate bcrypt's 72-byte password limit
  if (Buffer.byteLength(payload.password, "utf8") > 72) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Password cannot exceed 72 bytes",
    );
  }

  // Check whether the email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "An account with this email already exists",
    );
  }

  // Hash password before saving
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const userData = {
    name: payload.name,
    email,
    password: hashedPassword,
    role: "customer" as UserRole,
    ...(payload.phone ? { phone: payload.phone } : {}),
    ...(payload.avatar ? { avatar: payload.avatar } : {}),
  };

  try {
    const user = await User.create(userData);

    return user;
  } catch (error) {
    // Handle duplicate email race conditions
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "An account with this email already exists",
      );
    }

    throw error;
  }
};


// Get authenticated user's profile
const getMyProfile = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "User profile not found",
    );
  }

  if (user.status !== "active") {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Your account has been blocked",
    );
  }

  return user;
};

export const usersService = {
  registerUser,
  getMyProfile,
};