import mongoose from "mongoose";

import { env } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL, {
      autoIndex: false,
      autoCreate: false,
    });

    console.log(`MongoDB connected successfully: ${mongoose.connection.name}`);

    console.log("Automatic index creation: disabled");
    console.log("Automatic collection creation: disabled");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};
