
import mongoose from "mongoose";

import { env } from "../config/env.js";
import User from "../modules/users/users.model.js";

const checkRefreshTokenRevocation = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL, {
      autoIndex: false,
      autoCreate: false,
    });

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not available");
    }

    // Check collection existence before querying
    const collections = await db.listCollections().toArray();

    const collectionExists = collections.some(
      (collection) => collection.name === "refreshTokens",
    );

    if (!collectionExists) {
      console.log("refreshTokens collection does not exist");
      return;
    }

    console.log("refreshTokens collection exists");

    const email = process.env.CHECK_USER_EMAIL?.trim().toLowerCase();

    if (!email) {
      throw new Error("CHECK_USER_EMAIL environment variable is required");
    }

    const user = await User.findOne({ email }).select("_id").lean();

    if (!user) {
      console.log("Account not found");
      return;
    }

    const refreshTokens = db.collection("refreshTokens");

    const activeCount = await refreshTokens.countDocuments({
      user: user._id,
      revokedAt: null,
    });

    const revokedCount = await refreshTokens.countDocuments({
      user: user._id,
      revokedAt: { $ne: null },
    });

    console.log("Active refresh tokens:", activeCount);
    console.log("Revoked refresh tokens:", revokedCount);
  } catch (error) {
    console.error(
      "Refresh token verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void checkRefreshTokenRevocation();
