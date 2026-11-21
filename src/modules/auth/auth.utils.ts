
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
