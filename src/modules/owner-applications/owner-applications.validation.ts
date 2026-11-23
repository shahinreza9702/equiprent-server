import { z } from "zod";

const createOwnerApplicationSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Business name must be at least 2 characters")
      .max(150, "Business name cannot exceed 150 characters"),

    contactNumber: z
      .string()
      .trim()
      .min(7, "Contact number must be at least 7 characters")
      .max(20, "Contact number cannot exceed 20 characters"),

    address: z
      .string()
      .trim()
      .min(5, "Address must be at least 5 characters")
      .max(500, "Address cannot exceed 500 characters"),
  })
  .strict();

export const ownerApplicationValidation = {
  createOwnerApplicationSchema,
};