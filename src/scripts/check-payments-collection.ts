import "dotenv/config";
import mongoose from "mongoose";

const run = async () => {
  try {
    const uri = process.env.DATABASE_URL;

    if (!uri) {
      throw new Error("DATABASE_URL is missing");
    }

    await mongoose.connect(uri);

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection unavailable");
    }

    const exists = await db
      .listCollections({ name: "payments" }, { nameOnly: true })
      .hasNext();

    console.log("Payments collection exists:", exists);
    console.log("Database:", mongoose.connection.name);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error: unknown) => {
  console.error("Collection check failed:", error);
  process.exitCode = 1;
});
