import { createProductSchema, updateProductSchema, validateVariantIdentities } from "./validation";
import type {
  Product,
  ProductForm,
  ProductInput,
  ProductUpdate,
  VariantDraft,
} from "@/types/product";

export function newVariant(key: string): VariantDraft {
  return {
    key,
    sku: "",
    size: "",
    color: { name: { ar: "", en: "" }, hex: "#eeddbb" },
    stock: 0,
    price: 0,
    compareAtPrice: null,
    images: [],
    isActive: true,
  };
}

export function productForm(product?: Product): ProductForm {
  if (!product)
    return {
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      slug: "",
      category: "",
      gender: "unisex",
      ageGroup: "toddler",
      images: [],
      variants: [newVariant("initial")],
      isActive: true,
      isFeatured: false,
      isNewArrival: false,
      sortOrder: 0,
    };
  return {
    name: { ...product.name },
    description: { ar: product.description?.ar ?? "", en: product.description?.en ?? "" },
    slug: product.slug,
    category: product.category?._id ?? "",
    gender: product.gender,
    ageGroup: product.ageGroup,
    images: structuredClone(product.images ?? []),
    variants: product.variants.map((variant) => ({
      ...structuredClone(variant),
      key: variant._id,
    })),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    sortOrder: product.sortOrder,
  };
}

export function formInput(form: ProductForm): ProductInput {
  return {
    ...form,
    variants: form.variants.map((variant) => ({
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      images: variant.images,
      isActive: variant.isActive,
    })),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Only submit changed leaves. In particular, editing a name must not resend stock
// from the form's original snapshot and overwrite a later inventory adjustment.
function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(after)) {
    const previous = before[key];
    if (isObject(value) && isObject(previous)) {
      const nested = changedFields(previous, value);
      if (Object.keys(nested).length) changes[key] = nested;
    } else if (JSON.stringify(value) !== JSON.stringify(previous)) changes[key] = value;
  }
  return changes;
}

export function productPayload(
  form: ProductForm,
  original?: Product,
): ProductInput | ProductUpdate | null {
  const parsed = createProductSchema.parse(formInput(form));
  validateVariantIdentities(parsed.variants);
  if (!original) return parsed;
  const baseline = formInput(productForm(original));
  const { variants, ...fields } = parsed;
  const { variants: previousVariants, ...previousFields } = baseline;
  const changes = changedFields(previousFields, fields);
  const variantChanges: Record<string, unknown>[] = [];
  variants.forEach((variant, index) => {
    const id = form.variants[index]._id;
    if (!id) {
      variantChanges.push(variant);
      return;
    }
    const previousIndex = original.variants.findIndex((item) => item._id === id);
    if (previousIndex < 0) throw new Error("Unknown variant");
    const difference = changedFields(previousVariants[previousIndex], variant);
    if (Object.keys(difference).length) variantChanges.push({ _id: id, ...difference });
  });
  if (variantChanges.length) changes.variants = variantChanges;
  return Object.keys(changes).length ? updateProductSchema.parse(changes) : null;
}

export function availableStock(product: Pick<Product, "variants">) {
  return product.variants
    .filter((variant) => variant.isActive)
    .reduce((sum, variant) => sum + variant.stock, 0);
}

export function productPrice(product: Pick<Product, "variants">, locale: string) {
  const active = product.variants.filter((variant) => variant.isActive);
  const prices = (active.length ? active : product.variants).map((variant) => variant.price);
  if (!prices.length) return "—";
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency: "ILS" });
  const minimum = Math.min(...prices),
    maximum = Math.max(...prices);
  return minimum === maximum
    ? formatter.format(minimum)
    : `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
}
