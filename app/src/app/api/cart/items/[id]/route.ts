import {
  cartResponse,
  CartApiError,
  errorResponse,
  mutateCart,
  objectIdSchema,
  ownerId,
  quantitySchema,
  readBody,
  selectedProduct,
} from "@/lib/cart/server";
import { Product } from "@/models/Product";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const owner = await ownerId();
    const id = objectIdSchema.parse((await context.params).id).toLowerCase();
    const { quantity } = quantitySchema.parse(await readBody(request));
    await mutateCart(owner, async (items) => {
      const line = items.find((item) => item._id.toString() === id);
      if (!line) throw new CartApiError(404, "Cart item not found");
      const product = await Product.findById(line.product).select("slug").lean();
      if (!product) throw new CartApiError(404, "Product unavailable");
      const { variant } = await selectedProduct(product.slug, line.variantId.toString());
      if (quantity > variant.stock) throw new CartApiError(409, "Insufficient stock");
      return items.map((item) => (item === line ? { ...item, quantity } : item));
    });
    return cartResponse(owner);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const owner = await ownerId();
    const id = objectIdSchema.parse((await context.params).id).toLowerCase();
    await mutateCart(owner, (items) => {
      if (!items.some((item) => item._id.toString() === id))
        throw new CartApiError(404, "Cart item not found");
      return items.filter((item) => item._id.toString() !== id);
    });
    return cartResponse(owner);
  } catch (error) {
    return errorResponse(error);
  }
}
