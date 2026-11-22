
import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import type { JwtPayload } from "./auth.types.js";
import { authValidation } from "./auth.validation.js";

// Generate access token
export const generateAccessToken = (
  payload: JwtPayload,
): string => {
  const expiresIn: jwt.SignOptions["expiresIn"] =
    env.JWT_ACCESS_EXPIRES_IN as NonNullable<
      jwt.SignOptions["expiresIn"]
    >;

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn,
  });
};


// Generate refresh token
export const generateRefreshToken = (
  payload: JwtPayload,
): string => {
  const expiresIn: jwt.SignOptions["expiresIn"] =
    env.JWT_REFRESH_EXPIRES_IN as NonNullable<
      jwt.SignOptions["expiresIn"]
    >;

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn,
    jwtid: randomUUID(),
  });
};


// Verify access token
export const verifyAccessToken = (
  token: string,
): JwtPayload => {
  const decoded = jwt.verify(
    token,
    env.JWT_ACCESS_SECRET,
  );

  return authValidation.jwtPayloadSchema.parse(decoded);
};

// Verify refresh token
export const verifyRefreshToken = (
  token: string,
): JwtPayload => {
  const decoded = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET,
  );

  return authValidation.jwtPayloadSchema.parse(decoded);
};

// Hash refresh token before database storage
export const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};


// Get refresh token expiration date
export const getRefreshTokenExpiry = (
  token: string,
): Date => {
  const decoded = jwt.decode(token);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.exp !== "number"
  ) {
    throw new Error("Invalid refresh token expiration");
  }

  return new Date(decoded.exp * 1000);
};


const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 15;

// Generate a cryptographically secure password reset token
export const generatePasswordResetToken = (): string => {
  return randomBytes(32).toString("hex");
};

// Hash password reset token before database storage
export const hashPasswordResetToken = (
  token: string,
): string => {
  return createHash("sha256")
    .update(token)
    .digest("hex");
};

// Get password reset token expiration date
export const getPasswordResetTokenExpiry = (): Date => {
  return new Date(
    Date.now() +
      PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );
};
