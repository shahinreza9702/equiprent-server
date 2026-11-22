
import mongoose from "mongoose";

import { env } from "../config/env.js";

const setupPasswordResetTokensCollection =
  async (): Promise<void> => {
    try {
      await mongoose.connect(env.DATABASE_URL, {
        autoIndex: false,
        autoCreate: false,
      });

      const db = mongoose.connection.db;

      if (!db) {
        throw new Error("Database connection is not available");
      }

      const collectionName = "passwordResetTokens";

      const collections = await db
        .listCollections(
          { name: collectionName },
          { nameOnly: true },
        )
        .toArray();

      if (collections.length === 0) {
        await db.createCollection(collectionName);
        console.log("passwordResetTokens collection created successfully");
      } else {
        console.log("passwordResetTokens collection already exists");
      }

      const collection = db.collection(collectionName);
      const existingIndexes = await collection.indexes();

      const createIndexIfMissing = async (
        indexName: string,
        key: Record<string, 1 | -1>,
        options: {
          unique?: boolean;
          expireAfterSeconds?: number;
        } = {},
      ): Promise<void> => {
        const exists = existingIndexes.some(
          (index) => index.name === indexName,
        );

        if (exists) {
          console.log(`${indexName} index already exists`);
          return;
        }

        await collection.createIndex(key, {
          name: indexName,
          ...options,
        });

        console.log(`${indexName} index created successfully`);
      };

      await createIndexIfMissing(
        "unique_password_reset_token_hash",
        { tokenHash: 1 },
        { unique: true },
      );

      await createIndexIfMissing(
        "password_reset_token_user_index",
        { user: 1 },
      );

      await createIndexIfMissing(
        "password_reset_token_expiry_ttl",
        { expiresAt: 1 },
        { expireAfterSeconds: 0 },
      );

      console.log("Password reset token collection setup completed");
    } catch (error) {
      console.error("Collection setup failed:", error);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  };

void setupPasswordResetTokensCollection();
