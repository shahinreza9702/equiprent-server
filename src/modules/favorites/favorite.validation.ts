import { z } from "zod";

const equipmentIdParamsSchema = z.object({
  equipmentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid equipment ID"),
});

export const favoriteValidation = {
  equipmentIdParamsSchema,
};