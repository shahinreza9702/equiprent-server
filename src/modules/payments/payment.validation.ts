import { z } from "zod";

// Validate customer checkout requests.
const createCheckoutSessionSchema = z
  .object({
    equipment: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid equipment ID"),

    startDate: z.coerce.date(),

    endDate: z.coerce.date(),

    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1"),

    customerNote: z
      .string()
      .trim()
      .max(500, "Customer note cannot exceed 500 characters")
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.endDate > data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const paymentValidation = {
  createCheckoutSessionSchema,
};
