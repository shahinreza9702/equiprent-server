
import { z } from "zod";

import { EQUIPMENT_RENTAL_TYPES } from "./equipment.types.js";

// Create equipment validation
const createEquipmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Equipment name must be at least 2 characters")
      .max(150, "Equipment name cannot exceed 150 characters"),

    description: z
      .string()
      .trim()
      .min(10, "Equipment description must be at least 10 characters"),

    category: z
      .string()
      .trim()
      .min(2, "Category must be at least 2 characters"),

    rentalPrice: z
      .number()
      .positive("Rental price must be greater than 0"),

    rentalType: z.enum(EQUIPMENT_RENTAL_TYPES),

    location: z
      .string()
      .trim()
      .min(2, "Location must be at least 2 characters"),

    availableQuantity: z
      .number()
      .int("Available quantity must be a whole number")
      .min(0, "Available quantity cannot be negative"),

    condition: z
      .string()
      .trim()
      .min(2, "Equipment condition must be at least 2 characters"),

    brand: z
      .string()
      .trim()
      .min(1, "Equipment brand is required"),

    model: z
      .string()
      .trim()
      .min(1, "Equipment model is required"),

    image: z
      .string()
      .trim()
      .url("Please provide a valid image URL"),

    rentalTerms: z
      .string()
      .trim()
      .min(5, "Rental terms must be at least 5 characters"),
  })
  .strict();

// Update equipment validation
const updateEquipmentSchema = createEquipmentSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update equipment",
    },
  );

// Equipment listing query validation
const equipmentQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(50).default(12),

    search: z.string().trim().max(100).optional(),

    category: z.string().trim().min(2).max(100).optional(),

    location: z.string().trim().min(2).max(150).optional(),

    rentalType: z.enum(EQUIPMENT_RENTAL_TYPES).optional(),

    minPrice: z.coerce.number().min(0).optional(),

    maxPrice: z.coerce.number().min(0).optional(),
    
    sort: z
      .enum(["newest", "price-asc", "price-desc"])
      .default("newest"),
  })
  .strict()
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: "Minimum price cannot exceed maximum price",
      path: ["minPrice"],
    },
  );

// Export validation schemas
export const equipmentValidation = {
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentQuerySchema,
};