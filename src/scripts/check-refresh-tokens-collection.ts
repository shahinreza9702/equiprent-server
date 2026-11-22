
import mongoose from "mongoose";

import { env } from "../config/env.js";

const checkCollections = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL, {
      autoIndex: false,
      autoCreate: false,
    });

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not available");
    }

    const collections = await db.listCollections().toArray();

    console.log("Existing collections:");

    if (collections.length === 0) {
      console.log("No collections found");
    } else {
      collections.forEach((collection) => {
        console.log(`- ${collection.name}`);
      });
    }

    const refreshTokensExists = collections.some(
      (collection) => collection.name === "refreshTokens",
    );

    console.log(
      refreshTokensExists
        ? "refreshTokens collection already exists"
        : "refreshTokens collection does not exist",
    );
  } catch (error) {
    console.error("Collection check failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void checkCollections();
