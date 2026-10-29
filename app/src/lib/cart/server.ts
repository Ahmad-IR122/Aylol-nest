import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { MAX_CART_LINES, cartReferenceSchema, type CartItem } from "@/lib/cart/state";
import { getStorefrontProduct } from "@/lib/products/storefront";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import type { StorefrontProduct, StorefrontVariant } from "@/types/storefront";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const addSchema = cartReferenceSchema.extend({ productId: objectIdSchema.optional() });
export const quantitySchema = z.strictObject({
  quantity: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});

export class CartApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function ownerId() {
  const user = await getCurrentUser();
  if (!user) throw new CartApiError(401, "Authentication required");
  if (user.role !== "customer") throw new CartApiError(403, "Customer access required");
  return user._id;
}

export async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new CartApiError(400, "Invalid JSON body");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof CartApiError)
    return NextResponse.json({ message: error.message }, { status: error.status });
  if (error instanceof z.ZodError)
    return NextResponse.json(
      {
        message: "Invalid cart input",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  console.error("Cart API error:", error);
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}

export async function selectedProduct(slug: string, variantId: string) {
  const product = await getStorefrontProduct(slug);
  const variant = product?.variants.find((item) => item.id === variantId.toLowerCase());
  if (!product || !variant) throw new CartApiError(404, "Product or variant unavailable");
  return { product, variant };
}

export type CartLine = {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

function toItem(
  product: StorefrontProduct,
  variant: StorefrontVariant,
  line: CartLine,
): CartItem & { id: string; lineTotal: number; available: boolean } {
  return {
    id: line._id.toString(),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    variantId: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color.name,
    quantity: line.quantity,
    price: variant.price,
    stock: variant.stock,
    image: variant.images[0]?.url ?? product.images[0]?.url ?? null,
    lineTotal: variant.price * line.quantity,
    available: variant.stock >= line.quantity,
  };
}

export async function cartResponse(owner: mongoose.Types.ObjectId, status = 200) {
  const cart = await Cart.findOne({ owner }).lean();
  const products = await Product.find({
    _id: { $in: cart?.items.map((item) => item.product) ?? [] },
  })
    .select("_id slug")
    .lean();
  const slugs = new Map(products.map((product) => [product._id.toString(), product.slug]));
  const catalog = new Map<string, StorefrontProduct | null>();
  await Promise.all(
    [...new Set(slugs.values())].map(async (slug) => {
      catalog.set(slug, await getStorefrontProduct(slug));
    }),
  );
  const items = (cart?.items ?? []).flatMap((line) => {
    const product = catalog.get(slugs.get(line.product.toString()) ?? "");
    const variant = product?.variants.find((item) => item.id === line.variantId.toString());
    return product && variant ? [toItem(product, variant, line)] : [];
  });
  return NextResponse.json(
    {
      cart: {
        id: cart?._id.toString() ?? null,
        items,
        subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      },
    },
    { status },
  );
}

export async function mutateCart(
  owner: mongoose.Types.ObjectId,
  mutate: (items: CartLine[]) => Promise<CartLine[]> | CartLine[],
) {
  // The unique owner index makes creation idempotent; revision guards every later write.
  try {
    await Cart.updateOne(
      { owner },
      { $setOnInsert: { owner, items: [], revision: 0 } },
      { upsert: true },
    );
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000))
      throw error;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const cart = await Cart.findOne({ owner }).lean();
    if (!cart) continue;
    const items = await mutate(cart.items);
    if (items.length > MAX_CART_LINES) throw new CartApiError(409, "Cart is full");
    const result = await Cart.updateOne(
      { owner, revision: cart.revision },
      { $set: { items }, $inc: { revision: 1 } },
      { runValidators: true },
    );
    if (result.modifiedCount === 1) return;
  }
  throw new CartApiError(409, "Cart changed; retry request");
}
