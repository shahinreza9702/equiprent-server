
import mongoose from "mongoose";

import { env } from "../config/env.js";

const setupRefreshTokensCollection = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL, {
      autoIndex: false,
      autoCreate: false,
    });

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not available");
    }

    // Check whether refreshTokens collection exists
    const collectionExists = await db
      .listCollections({ name: "refreshTokens" })
      .hasNext();

    if (!collectionExists) {
      await db.createCollection("refreshTokens");
      console.log("refreshTokens collection created successfully");
    } else {
      console.log("refreshTokens collection already exists");
    }

    const collection = db.collection("refreshTokens");
    const indexes = await collection.indexes();

    // Create unique tokenHash index
    const tokenHashIndexExists = indexes.some(
      (index) =>
        index.key.tokenHash === 1 && index.unique === true,
    );

    if (!tokenHashIndexExists) {
      await collection.createIndex(
        { tokenHash: 1 },
        {
          unique: true,
          name: "unique_refresh_token_hash",
        },
      );

      console.log("Unique tokenHash index created successfully");
    } else {
      console.log("Unique tokenHash index already exists");
    }

    // Create user index
    const userIndexExists = indexes.some(
      (index) => index.key.user === 1,
    );

    if (!userIndexExists) {
      await collection.createIndex(
        { user: 1 },
        { name: "refresh_token_user_index" },
      );

      console.log("User index created successfully");
    } else {
      console.log("User index already exists");
    }

    // Create TTL index for expired tokens
    const expiresAtIndexExists = indexes.some(
      (index) =>
        index.key.expiresAt === 1 &&
        index.expireAfterSeconds === 0,
    );

    if (!expiresAtIndexExists) {
      await collection.createIndex(
        { expiresAt: 1 },
        {
          expireAfterSeconds: 0,
          name: "refresh_token_expiry_ttl",
        },
      );

      console.log("TTL index created successfully");
    } else {
      console.log("TTL index already exists");
    }
  } catch (error) {
    console.error("Refresh token collection setup failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void setupRefreshTokensCollection();
