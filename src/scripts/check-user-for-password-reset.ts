
import mongoose from "mongoose";

import { env } from "../config/env.js";
import User from "../modules/users/users.model.js";

const checkUser = async (): Promise<void> => {
  try {
    await mongoose.connect(env.DATABASE_URL, {
      autoIndex: false,
      autoCreate: false,
    });

    const email = process.env.CHECK_USER_EMAIL?.trim().toLowerCase();

    if (!email) {
      throw new Error("CHECK_USER_EMAIL environment variable is required");
    }

    const user = await User.findOne({ email })
      .select("status isEmailVerified")
      .lean();

    if (!user) {
      console.log("Account found: No");
      return;
    }

    console.log("Account found: Yes");
    console.log("Account status:", user.status);
    console.log("Email verified:", user.isEmailVerified);
    console.log(
      "Eligible for current forgot-password lookup:",
      user.status === "active",
    );
  } catch (error) {
    console.error(
      "User verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void checkUser();
