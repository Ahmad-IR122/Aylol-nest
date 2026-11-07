import { NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/require-admin";
import { getShippingRegions } from "@/lib/shipping/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(
      { regions: await getShippingRegions() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("Admin shipping read failed:", error);
    return NextResponse.json({ message: "Shipping configuration unavailable" }, { status: 503 });
  }
}
