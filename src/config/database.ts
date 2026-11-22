
import mongoose from "mongoose";

import { env } from "./env.js";

// Reuse the connection promise across requests in a warm instance.
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.DATABASE_URL, {
        autoIndex: false,
        autoCreate: false,
      })
      .catch((error: unknown) => {
        connectionPromise = null;
        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  await connectionPromise;

  console.log(
    `MongoDB connected successfully: ${mongoose.connection.name}`,
  );
};
