import mongoose, { Schema } from "mongoose";

import type { IFavorite } from "./favorite.types.js";

const favoriteSchema = new Schema<IFavorite>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },

    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: [true, "Equipment is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "favorites",
  },
);

// Prevent duplicate favorites for the same customer and equipment.
favoriteSchema.index(
  { customer: 1, equipment: 1 },
  {
    unique: true,
    name: "unique_customer_equipment_favorite",
  },
);

const Favorite = mongoose.model<IFavorite>(
  "Favorite",
  favoriteSchema,
);

export default Favorite;