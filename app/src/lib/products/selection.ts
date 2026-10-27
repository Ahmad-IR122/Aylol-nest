import type { StorefrontImage, StorefrontVariant } from "@/types/storefront";

// Match the admin's size/color identity rules; translated labels and swatches
// are presentation, never variant identifiers.
export function sizeKey(size: string) {
  return size.trim().toLowerCase();
}

export function colorKey(variant: StorefrontVariant) {
  return variant.color.name.en.trim().toLowerCase();
}

export function findSelectedVariant(variants: StorefrontVariant[], size: string, color: string) {
  return variants.find((variant) => sizeKey(variant.size) === size && colorKey(variant) === color);
}

export function quantityForStock(quantity: number, stock: number) {
  return Math.max(1, Math.min(Number.isSafeInteger(quantity) ? quantity : 1, stock));
}

export function galleryImages(
  images: StorefrontImage[],
  variants: StorefrontVariant[],
  selected?: StorefrontVariant,
) {
  const seen = new Set<string>();
  return [
    ...(selected?.images ?? []),
    ...images,
    ...variants.flatMap((variant) => variant.images),
  ].filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}
