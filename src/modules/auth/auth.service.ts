
import bcrypt from "bcryptjs";

import User from "../users/users.model.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "./auth.utils.js";

interface LoginInput {
  email: string;
  password: string;
}

const loginUser = async (payload: LoginInput) => {
  // Find user by email and explicitly include password
  const user = await User.findOne({
    email: payload.email,
  }).select("+password");

  // Reject invalid credentials
  if (!user) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

  // Reject blocked accounts
  if (user.status !== "active") {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Your account has been blocked",
    );
  }

  // Prepare JWT payload
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  // Generate tokens
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Return authentication data
  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const authService = {
  loginUser,
};
