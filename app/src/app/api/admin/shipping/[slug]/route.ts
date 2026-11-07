import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/require-admin";
import { shippingRegions, priceInCents } from "@/lib/checkout/validation";
import { initializeShippingRegions } from "@/lib/shipping/server";
import { ShippingZone } from "@/models/ShippingZone";

export const runtime = "nodejs";

const updateSchema = z.strictObject({
  shippingFee: z
    .number()
    .finite()
    .nonnegative()
    .refine((value) => priceInCents(value) !== null),
  isActive: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    if (!shippingRegions.some((region) => region === slug))
      return NextResponse.json({ message: "Unknown shipping region" }, { status: 404 });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json({ message: "Cross-origin update is not allowed" }, { status: 403 });
    const body = updateSchema.parse(await request.json());
    await initializeShippingRegions();
    const region = await ShippingZone.findOneAndUpdate(
      { slug },
      { $set: body },
      { new: true, runValidators: true },
    ).lean();
    if (!region) return NextResponse.json({ message: "Unknown shipping region" }, { status: 404 });
    return NextResponse.json({
      region: {
        id: region._id.toString(),
        slug: region.slug,
        name: region.name,
        shippingFee: region.shippingFee,
        isActive: region.isActive,
        updatedAt: region.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json({ message: "Invalid shipping settings" }, { status: 400 });
    console.error("Admin shipping update failed:", error);
    return NextResponse.json({ message: "Shipping update unavailable" }, { status: 503 });
  }
}
