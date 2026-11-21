
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB before starting the server
    await connectDatabase();

    // Start Express server
    app.listen(env.PORT, () => {
      console.log(
        `EquipRent API server running on port ${env.PORT}`,
      );

      console.log(
        `Environment: ${env.NODE_ENV}`,
      );
    });
  } catch (error) {
    console.error("Failed to start EquipRent API:", error);
    process.exitCode = 1;
  }
};

void startServer();
