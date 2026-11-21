import { z } from "zod";

// User registration validation
const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters"),

  phone: z
    .string()
    .trim()
    .optional(),

  avatar: z
    .string()
    .trim()
    .url("Please provide a valid avatar URL")
    .optional(),
});

// Export validation schema
export const userValidation = {
  registerUserSchema,
};