import mongoose from "mongoose";
import { connectDatabase } from "./src/config/database.js";

try {
  await connectDatabase();

  const collections = await mongoose.connection.db!.listCollections(
    { name: "bookings" },
  ).toArray();

  console.log(
    "Bookings collection exists:",
    collections.length > 0,
  );
} catch (error) {
  console.error("Collection check failed:", error);
} finally {
  await mongoose.disconnect();
}
