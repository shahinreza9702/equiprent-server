
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

  phone: z.string().trim().optional(),

  avatar: z
    .string()
    .trim()
    .url("Please provide a valid avatar URL")
    .optional(),
});

// User profile update validation
const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),

    phone: z.string().trim().optional(),

    avatar: z
      .string()
      .trim()
      .url("Please provide a valid avatar URL")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some(
      (value) => value !== undefined && value !== "",
    ),
    {
      message: "At least one field is required to update",
    },
  );

// Export validation schemas
export const userValidation = {
  registerUserSchema,
  updateProfileSchema,
};
