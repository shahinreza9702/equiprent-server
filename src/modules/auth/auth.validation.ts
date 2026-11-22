
import { z } from "zod";

// Login validation schema
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Invalid password"),
});

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
});

// Reset password validation schema
const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters"),
});

// JWT payload validation
export const jwtPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["customer", "owner", "admin"]),
});

// Export authentication validation
export const authValidation = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  jwtPayloadSchema,
};
