import { NextResponse } from "next/server";
import { getShippingRegions } from "@/lib/shipping/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const regions = (await getShippingRegions()).filter((region) => region.isActive);
    return NextResponse.json({ regions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Shipping regions unavailable:", error);
    return NextResponse.json({ message: "Shipping configuration unavailable" }, { status: 503 });
  }
}

