
import mongoose from "mongoose";

import { env } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL);

    console.log(
      `MongoDB connected successfully: ${mongoose.connection.name}`,
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};
