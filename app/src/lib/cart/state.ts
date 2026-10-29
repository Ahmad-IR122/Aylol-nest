import { z } from "zod";
import type { LocalizedText } from "@/types/category";

export const MAX_CART_LINES = 50;
export const CART_STORAGE_KEY = "aylol-nest-cart-v1";

export const cartReferenceSchema = z.strictObject({
  slug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  variantId: z.string().regex(/^[a-f\d]{24}$/i),
  quantity: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});
export const cartReferencesSchema = z.array(cartReferenceSchema).max(MAX_CART_LINES);

export type CartReference = z.infer<typeof cartReferenceSchema>;
export type CartItem = CartReference & {
  productId: string;
  name: LocalizedText;
  sku: string;
  size: string;
  color: LocalizedText;
  price: number;
  stock: number;
  image: string | null;
};
export type CartError =
  "invalid" | "unavailable" | "stock" | "server" | "busy" | "full" | "unauthorized";
export type CartResult = { ok: true } | { ok: false; error: CartError };

export function cartKey(item: Pick<CartReference, "slug" | "variantId">) {
  return `${item.slug}:${item.variantId.toLowerCase()}`;
}

export function cartReferences(items: CartReference[]): CartReference[] {
  return items.map(({ slug, variantId, quantity }) => ({ slug, variantId, quantity }));
}

export function parseStoredCart(raw: string | null): CartReference[] {
  if (!raw) return [];
  try {
    const result = cartReferencesSchema.safeParse(JSON.parse(raw));
    if (!result.success) return [];
    const unique = new Map<string, CartReference>();
    for (const item of result.data) {
      const key = cartKey(item);
      const previous = unique.get(key);
      const quantity = (previous?.quantity ?? 0) + item.quantity;
      if (!Number.isSafeInteger(quantity)) return [];
      unique.set(key, { ...item, variantId: item.variantId.toLowerCase(), quantity });
    }
    return [...unique.values()];
  } catch {
    return [];
  }
}

export function requestedCartQuantity(items: CartReference[], reference: CartReference): number {
  return (
    (items.find((item) => cartKey(item) === cartKey(reference))?.quantity ?? 0) + reference.quantity
  );
}
