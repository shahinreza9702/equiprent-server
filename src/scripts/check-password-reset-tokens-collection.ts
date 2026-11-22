
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

    collections.forEach((collection) => {
      console.log(`- ${collection.name}`);
    });

    const collectionExists = collections.some(
      (collection) => collection.name === "passwordResetTokens",
    );

    if (!collectionExists) {
      console.log("passwordResetTokens collection does not exist");
      return;
    }

    console.log("passwordResetTokens collection exists");

    const indexes = await db
      .collection("passwordResetTokens")
      .indexes();

    console.log("\nPassword reset token indexes:");

    indexes.forEach((index) => {
      console.log(`- ${index.name}`);
      console.log(`  Keys: ${JSON.stringify(index.key)}`);

      if (index.expireAfterSeconds !== undefined) {
        console.log(`  TTL: ${index.expireAfterSeconds} seconds`);
      }
    });
  } catch (error) {
    console.error("Collection check failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void checkCollections();
