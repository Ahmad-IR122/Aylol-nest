import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productErrorResponse } from "@/lib/products/errors";
import { objectIdSchema, readProductBody } from "@/lib/products/validation";
import { ExploreSelection } from "@/models/ExploreSelection";
import { Product } from "@/models/Product";

export const runtime = "nodejs";

const selectionSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  productIds: z
    .array(objectIdSchema)
    .max(200)
    .refine(
      (ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length,
      "Products must be unique",
    ),
});

export async function GET() {
  try {
    await requireAdmin();
    const selection = await ExploreSelection.findById("explore").lean();
    const ids = selection?.productIds.map(String) ?? [];
    const products = ids.length
      ? await Product.find({ _id: { $in: ids } })
          .select("name slug isActive images.url variants.images.url")
          .lean()
      : [];
    const byId = new Map(products.map((product) => [String(product._id), product]));
    return NextResponse.json({
      revision: selection?.revision ?? 0,
      productIds: ids,
      products: ids.flatMap((id) => {
        const product = byId.get(id);
        return product
          ? [
              {
                id,
                name: product.name,
                slug: product.slug,
                isActive: product.isActive,
                image: product.images?.[0]?.url ?? product.variants?.[0]?.images?.[0]?.url ?? null,
              },
            ]
          : [];
      }),
    });
  } catch (error) {
    return productErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const input = selectionSchema.parse(await readProductBody(request));
    const ids = input.productIds.map((id) => new mongoose.Types.ObjectId(id));
    if (ids.length && (await Product.countDocuments({ _id: { $in: ids } })) !== ids.length) {
      return NextResponse.json({ message: "A selected product no longer exists" }, { status: 400 });
    }
    // An empty first selection needs a singleton to compare against. The unique
    // _id makes simultaneous initialization safe without changing products.
    try {
      await ExploreSelection.updateOne(
        { _id: "explore" },
        { $setOnInsert: { productIds: [], revision: 0 } },
        { upsert: true },
      );
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000))
        throw error;
    }
    const updated = await ExploreSelection.findOneAndUpdate(
      { _id: "explore", revision: input.revision },
      { $set: { productIds: ids }, $inc: { revision: 1 } },
      { new: true, runValidators: true },
    ).lean();
    if (!updated)
      return NextResponse.json(
        { message: "Explore selection changed; reload and retry" },
        { status: 409 },
      );
    return NextResponse.json({
      revision: updated.revision,
      productIds: updated.productIds.map(String),
    });
  } catch (error) {
    return productErrorResponse(error);
  }
}
