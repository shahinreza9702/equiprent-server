import mongoose from "mongoose";

import { env } from "../config/env.js";

const setupUsersCollection = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL, {
      autoIndex: false,
      autoCreate: false,
    });

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not available");
    }

    // Check whether users collection already exists
    const existingCollection = await db
      .listCollections({ name: "users" })
      .hasNext();

    if (!existingCollection) {
      await db.createCollection("users");
      console.log("Users collection created successfully");
    } else {
      console.log("Users collection already exists");
    }

    // Create unique email index
    const usersCollection = db.collection("users");

    const indexes = await usersCollection.indexes();

    const emailIndexExists = indexes.some(
      (index) =>
        index.key.email === 1 && index.unique === true,
    );

    if (!emailIndexExists) {
      await usersCollection.createIndex(
        { email: 1 },
        {
          unique: true,
          name: "unique_user_email",
        },
      );

      console.log("Unique email index created successfully");
    } else {
      console.log("Unique email index already exists");
    }
  } catch (error) {
    console.error("Users collection setup failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void setupUsersCollection();