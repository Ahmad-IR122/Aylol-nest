import mongoose from "mongoose";
import {
  addSchema,
  cartResponse,
  CartApiError,
  errorResponse,
  mutateCart,
  ownerId,
  readBody,
  selectedProduct,
} from "@/lib/cart/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const owner = await ownerId();
    const { slug, productId, variantId, quantity } = addSchema.parse(await readBody(request));
    const { product } = await selectedProduct(slug, variantId);
    if (productId && product.id !== productId.toLowerCase())
      throw new CartApiError(400, "Product ID does not match slug");
    let created = false;
    await mutateCart(owner, async (items) => {
      const { variant } = await selectedProduct(slug, variantId);
      const existing = items.find(
        (item) =>
          item.product.toString() === product.id && item.variantId.toString() === variant.id,
      );
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (!Number.isSafeInteger(nextQuantity) || nextQuantity > variant.stock)
        throw new CartApiError(409, "Insufficient stock");
      created = !existing;
      if (existing)
        return items.map((item) =>
          item === existing ? { ...item, quantity: nextQuantity } : item,
        );
      return [
        ...items,
        {
          _id: new mongoose.Types.ObjectId(),
          product: new mongoose.Types.ObjectId(product.id),
          variantId: new mongoose.Types.ObjectId(variant.id),
          quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });
    return cartResponse(owner, created ? 201 : 200);
  } catch (error) {
    return errorResponse(error);
  }
}
