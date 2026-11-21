
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

export const jwtPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["customer", "owner", "admin"]),
});

// Export authentication validation
export const authValidation = {
  loginSchema,
  jwtPayloadSchema,
};
