
import mongoose from "mongoose";
import { connectDatabase } from "./src/config/database.js";

const checkExistingData = async () => {
  try {
    await connectDatabase();

    const collections = await mongoose.connection.db
      ?.listCollections({}, { nameOnly: true })
      .toArray();

    console.log("\nExisting collections:");

    for (const collection of collections ?? []) {
      console.log(`- ${collection.name}`);
    }

    const collectionNames = (collections ?? []).map(
      (collection) => collection.name,
    );

    for (const name of ["users", "equipments", "bookings"]) {
      if (collectionNames.includes(name)) {
        const count = await mongoose.connection.db
          ?.collection(name)
          .countDocuments();

        console.log(`${name}: exists (${count ?? 0} documents)`);
      } else {
        console.log(`${name}: does not exist`);
      }
    }
  } catch (error) {
    console.error("Database inspection failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void checkExistingData();
