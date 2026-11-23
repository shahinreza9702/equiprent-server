import mongoose from "mongoose";

import Favorite from "./favorite.model.js";
import Equipment from "../equipment/equipment.model.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

import type {
  IFavoriteWithEquipment,
} from "./favorite.types.js";

let collectionInitializationPromise: Promise<void> | null = null;

// Initialize the favorites collection and its unique index.
const ensureFavoritesCollection = async (): Promise<void> => {
  if (!collectionInitializationPromise) {
    collectionInitializationPromise = (async () => {
      try {
        await Favorite.createCollection();
      } catch (error) {
        const mongoError = error as { code?: number };

        // NamespaceExists means the collection already exists.
        if (mongoError.code !== 48) {
          throw error;
        }
      }

      await Favorite.collection.createIndex(
        { customer: 1, equipment: 1 },
        {
          unique: true,
          name: "unique_customer_equipment_favorite",
        },
      );
    })().catch((error: unknown) => {
      collectionInitializationPromise = null;
      throw error;
    });
  }

  await collectionInitializationPromise;
};

// Validate authenticated customer ID.
const validateCustomerId = (customerId: string): void => {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid authenticated user",
    );
  }
};

// Get all favorites belonging to a customer.
const getMyFavorites = async (customerId: string) => {
  validateCustomerId(customerId);

  await ensureFavoritesCollection();

  const favorites = (await Favorite.find({
    customer: new mongoose.Types.ObjectId(customerId),
  })
    .populate({
      path: "equipment",
      select:
        "name category location rentalPrice rentalType image status approvalStatus availableQuantity",
    })
    .sort({ createdAt: -1 })
    .lean()) as unknown as IFavoriteWithEquipment[];

  // Ignore favorites whose equipment has been deleted.
  const validFavorites = favorites.filter(
    (favorite) => favorite.equipment !== null,
  );

  const available = validFavorites.filter(
    (favorite) =>
      favorite.equipment?.approvalStatus === "approved" &&
      favorite.equipment.status === "available" &&
      favorite.equipment.availableQuantity > 0,
  ).length;

  return {
    favorites: validFavorites,
    total: validFavorites.length,
    available,
  };
};

// Add equipment to customer favorites.
const addFavorite = async (
  customerId: string,
  equipmentId: string,
) => {
  validateCustomerId(customerId);

  if (!mongoose.isValidObjectId(equipmentId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid equipment ID",
    );
  }

  await ensureFavoritesCollection();

  const equipment = await Equipment.findById(equipmentId).select(
    "approvalStatus",
  );

  if (!equipment) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Equipment not found",
    );
  }

  if (equipment.approvalStatus !== "approved") {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Only approved equipment can be added to favorites",
    );
  }

  // Upsert makes adding the same favorite idempotent.
  const favorite = await Favorite.findOneAndUpdate(
    {
      customer: new mongoose.Types.ObjectId(customerId),
      equipment: new mongoose.Types.ObjectId(equipmentId),
    },
    {
      $setOnInsert: {
        customer: new mongoose.Types.ObjectId(customerId),
        equipment: new mongoose.Types.ObjectId(equipmentId),
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return favorite;
};

// Remove equipment from customer favorites.
const removeFavorite = async (
  customerId: string,
  equipmentId: string,
) => {
  validateCustomerId(customerId);

  if (!mongoose.isValidObjectId(equipmentId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid equipment ID",
    );
  }

  await ensureFavoritesCollection();

  const favorite = await Favorite.findOneAndDelete({
    customer: new mongoose.Types.ObjectId(customerId),
    equipment: new mongoose.Types.ObjectId(equipmentId),
  });

  if (!favorite) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "Favorite not found",
    );
  }

  return favorite;
};

const favoriteService = {
  getMyFavorites,
  addFavorite,
  removeFavorite,
};

export default favoriteService;