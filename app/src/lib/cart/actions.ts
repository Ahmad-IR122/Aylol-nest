"use server";

import { getStorefrontProduct } from "@/lib/products/storefront";
import type { StorefrontProduct, StorefrontVariant } from "@/types/storefront";
import {
  cartReferenceSchema,
  cartReferencesSchema,
  cartKey,
  type CartItem,
  type CartError,
} from "./state";

function toCartItem(
  product: StorefrontProduct,
  variant: StorefrontVariant,
  quantity: number,
): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    variantId: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color.name,
    quantity,
    price: variant.price,
    stock: variant.stock,
    image: variant.images[0]?.url ?? product.images[0]?.url ?? null,
  };
}

// Guest carts contain public catalog references only. This action neither
// reserves inventory nor writes orders; all price and identity fields come
// from the active catalog, never from browser storage or the caller.
export async function validateCartItem(
  input: unknown,
): Promise<{ ok: true; item: CartItem } | { ok: false; error: CartError }> {
  const parsed = cartReferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const { slug, variantId, quantity } = parsed.data;
    const product = await getStorefrontProduct(slug);
    const variant = product?.variants.find((item) => item.id === variantId.toLowerCase());
    if (!product || !variant) return { ok: false, error: "unavailable" };
    if (variant.stock < quantity) return { ok: false, error: "stock" };
    return { ok: true, item: toCartItem(product, variant, quantity) };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function refreshCart(
  input: unknown,
): Promise<{ ok: true; items: CartItem[]; adjusted: boolean } | { ok: false; error: CartError }> {
  const parsed = cartReferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const keys = parsed.data.map(cartKey);
  if (new Set(keys).size !== keys.length) return { ok: false, error: "invalid" };
  try {
    const products = new Map<string, StorefrontProduct | null>();
    await Promise.all(
      [...new Set(parsed.data.map((item) => item.slug))].map(async (slug) => {
        products.set(slug, await getStorefrontProduct(slug));
      }),
    );
    let adjusted = false;
    const items: CartItem[] = [];
    for (const reference of parsed.data) {
      const product = products.get(reference.slug);
      const variant = product?.variants.find(
        (item) => item.id === reference.variantId.toLowerCase(),
      );
      if (!product || !variant || variant.stock < 1) {
        adjusted = true;
        continue;
      }
      const quantity = Math.min(reference.quantity, variant.stock);
      adjusted ||= quantity !== reference.quantity;
      items.push(toCartItem(product, variant, quantity));
    }
    return { ok: true, items, adjusted };
  } catch {
    return { ok: false, error: "server" };
  }
}
