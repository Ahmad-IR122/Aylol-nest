import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID");
const nonempty = z.string().trim().min(1);
const nameSchema = z.strictObject({ ar: nonempty, en: nonempty });
const textSchema = z.strictObject({ ar: z.string().trim(), en: z.string().trim() });
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const money = z.number().finite().nonnegative();
const imageSchema = z.strictObject({
  url: z
    .string()
    .trim()
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
      } catch {
        return false;
      }
    }, "Image must be an absolute HTTPS URL without credentials"),
  publicId: nonempty,
  alt: textSchema.partial().optional(),
});
const colorSchema = z.strictObject({
  name: nameSchema,
  hex: z
    .string()
    .trim()
    .regex(/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i, "Invalid color hex code"),
});
const variantSchema = z.strictObject({
  sku: nonempty.transform((value) => value.toUpperCase()),
  size: nonempty,
  color: colorSchema,
  stock: integer.optional(),
  price: money,
  compareAtPrice: money.nullable().optional(),
  images: z.array(imageSchema).optional(),
  isActive: z.boolean().optional(),
});
const productSchema = z.strictObject({
  name: nameSchema,
  slug: nonempty
    .transform((value) => value.toLowerCase())
    .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")),
  description: textSchema.partial().optional(),
  category: objectIdSchema,
  images: z.array(imageSchema).optional(),
  variants: z.array(variantSchema).min(1),
  gender: z.enum(["boys", "girls", "unisex"]),
  ageGroup: z.enum(["newborn", "baby", "toddler", "kids"]),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: integer.optional(),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema
  .partial()
  .extend({
    name: nameSchema.partial().optional(),
    variants: z
      .array(
        z.union([
          variantSchema.partial().extend({
            _id: objectIdSchema,
            color: colorSchema
              .partial()
              .extend({ name: nameSchema.partial().optional() })
              .optional(),
          }),
          variantSchema,
        ]),
      )
      .min(1)
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No fields provided for update");

const positiveQueryInteger = (fallback: string, maximum: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Must be a positive integer")
    .default(fallback)
    .transform(Number)
    .pipe(z.number().int().min(1).max(maximum));

export const productQuerySchema = z.strictObject({
  search: z.string().trim().max(200).optional(),
  category: objectIdSchema.optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: positiveQueryInteger("1", 100000),
  limit: positiveQueryInteger("20", 100),
  sortBy: z
    .enum(["createdAt", "updatedAt", "sortOrder", "name.ar", "name.en"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export function parseProductQuery(params: URLSearchParams) {
  const entries: Record<string, string> = {};
  for (const [key, value] of params) {
    if (Object.hasOwn(entries, key)) {
      throw new ProductInputError(`Duplicate query parameter: ${key}`);
    }
    Object.defineProperty(entries, key, { value, enumerable: true });
  }
  return productQuerySchema.parse(entries);
}

export class ProductInputError extends Error {}

export async function readProductBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ProductInputError("Invalid JSON body");
  }
}

export function escapeProductSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Enforce identities within a product; the existing SKU index is not globally unique.
export function validateVariantIdentities(
  variants: Iterable<{
    sku: string;
    size: string;
    color?: { name?: { ar: string; en: string } | null; hex: string } | null;
  }>,
) {
  const skus = new Set<string>();
  const combinations = new Set<string>();
  for (const variant of variants) {
    if (!variant.color?.name) {
      throw new ProductInputError("Variant color names are required");
    }
    const sku = variant.sku.trim().toUpperCase();
    const combination = JSON.stringify([
      variant.size.trim().toLowerCase(),
      variant.color.name.en.trim().toLowerCase(),
    ]);
    if (skus.has(sku) || combinations.has(combination)) {
      throw new ProductInputError("Variants must have unique SKUs and size/color combinations");
    }
    skus.add(sku);
    combinations.add(combination);
  }
}

// Nested partial updates preserve omitted languages and color fields. Arrays replace
// only the explicitly supplied field (for example, a variant's images).
export function setProductFields(
  set: (path: string, value: unknown) => void,
  fields: Record<string, unknown>,
  prefix = "",
) {
  for (const [key, value] of Object.entries(fields)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      setProductFields(set, value as Record<string, unknown>, path);
    } else {
      set(path, value);
    }
  }
}
