import { z } from "zod";

const createBookingSchema = z
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


const bookingQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(50).default(10),

    status: z
      .enum([
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ])
      .optional(),
  })
  .strict();

// Owner-specific booking filters
const ownerBookingQuerySchema = bookingQuerySchema.extend({
  equipment: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid equipment ID")
    .optional(),
});


const updateBookingStatusSchema = z
  .object({
    status: z.enum([
      "approved",
      "rejected",
      "completed",
    ]),

    ownerResponse: z
      .string()
      .trim()
      .max(500, "Owner response cannot exceed 500 characters")
      .optional(),
  })
  .strict();

const cancelBookingSchema = z.object({}).strict();

export const bookingValidation = {
  createBookingSchema,
  bookingQuerySchema,
  ownerBookingQuerySchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
};
