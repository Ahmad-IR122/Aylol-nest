import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/require-admin";
import { priceInCents } from "@/lib/checkout/validation";
import { getShippingRegions, initializeShippingRegions } from "@/lib/shipping/server";
import { ShippingZone } from "@/models/ShippingZone";

export const runtime = "nodejs";

const nameSchema = z.string().trim().min(1).max(120);
const createSchema = z.strictObject({
  name: z.strictObject({ ar: nameSchema, en: nameSchema }),
  shippingFee: z.number().refine((fee) => priceInCents(fee) !== null),
  isActive: z.boolean(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json({ message: "Cross-origin update is not allowed" }, { status: 403 });
    const input = createSchema.parse(await request.json());
    await initializeShippingRegions();
    const region = await ShippingZone.create({
      ...input,
      slug: `region_${randomUUID().replaceAll("-", "")}`,
      sortOrder: 3,
    });
    return NextResponse.json({
      region: {
        id: region._id.toString(),
        slug: region.slug,
        name: region.name,
        shippingFee: region.shippingFee,
        isActive: region.isActive,
        updatedAt: region.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json({ message: "Invalid shipping settings" }, { status: 400 });
    console.error("Admin shipping creation failed:", error);
    return NextResponse.json({ message: "Shipping creation unavailable" }, { status: 503 });
  }
}

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
