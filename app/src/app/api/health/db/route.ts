import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mongoose = await connectDB();

    await mongoose.connection.db?.admin().ping();

    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
      },
      { status: 503 },
    );
  }
}
