import "dotenv/config";
import mongoose from "mongoose";

import Payment from "../modules/payments/payment.model.js";

const setup = async () => {
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

    if (exists) {
      console.log("Payments collection already exists.");
    } else {
      await Payment.createCollection();
      console.log("Payments collection created successfully.");
    }

    await Payment.createIndexes();

    console.log("Payments indexes created successfully.");

    const indexes = await db
     .collection("payments")
      .indexes();

    console.log(
      "Payments indexes:",
      indexes.map((index) => index.name),
    );
  } finally {
    await mongoose.disconnect();
  }
};

setup().catch((error: unknown) => {
  console.error("Payments collection setup failed:", error);
  process.exitCode = 1;
});
