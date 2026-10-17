import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

type cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose: cached;
};

const chache = globalForMongoose.mongoose ?? { conn: null, promise: null };

export const connectDB = async (): Promise<typeof mongoose> => {
  if (chache.conn) {
    return chache.conn;
  }

  if (!chache.promise) {
    chache.promise = mongoose.connect(MONGODB_URI!, {
      dbName: "aylol_nest",
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    chache.conn = await chache.promise;
  } catch (error) {
    chache.promise = null;
    throw error;
  }

  return chache.conn;
};
