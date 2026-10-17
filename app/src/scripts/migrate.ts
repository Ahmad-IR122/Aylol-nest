import "dotenv/config";
import mongoose from "mongoose";

import { User } from "../models/User";

async function migrate() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  try {
    await mongoose.connect(uri, {
      dbName: "aylol_nest",
    });

    console.log("Connected to MongoDB");

    await User.createCollection();

    console.log("Users collection created or already exists");

    await User.createIndexes();

    console.log("User indexes created successfully");

    console.log("Migration completed successfully");
  } finally {
    await mongoose.disconnect();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
