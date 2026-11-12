import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { Category, type ICategory } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";
import type { HomeProduct } from "@/lib/home-data";
import type { LocalizedText } from "@/types/category";
import type { StorefrontImage, StorefrontProduct } from "@/types/storefront";

export type StorefrontProducts = { products: HomeProduct[]; error: boolean };

type PublicImage = Pick<IProduct["images"][number], "url" | "alt">;
type PublicVariant = Pick<IProduct["variants"][number], "isActive" | "price" | "stock"> & {
  images: PublicImage[];
};
type PublicProduct = Pick<IProduct, "name" | "slug" | "isNewArrival"> & {
  _id: { toString(): string };
  category: Pick<ICategory, "name"> | null;
  images: PublicImage[];
  variants: PublicVariant[];
};

type DetailProduct = Omit<IProduct, "category"> & {
  _id: { toString(): string };
  category: (Pick<ICategory, "name" | "slug"> & { _id: { toString(): string } }) | null;
};

function localized(value?: Partial<LocalizedText> | null): LocalizedText {
  return { ar: value?.ar || value?.en || "", en: value?.en || value?.ar || "" };
}

function validImage(image: PublicImage) {
  try {
    const url = new URL(image.url);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

function publicImages(images: PublicImage[] = []): StorefrontImage[] {
  const seen = new Set<string>();
  return images.filter(validImage).flatMap((image) => {
    if (seen.has(image.url)) return [];
    seen.add(image.url);
    return [{ url: image.url, alt: localized(image.alt) }];
  });
}

function toHomeProduct(product: PublicProduct): HomeProduct {
  const variants = (product.variants ?? []).filter((variant) => variant.isActive);
  const prices = variants
    .map((variant) => variant.price)
    .filter((price) => Number.isFinite(price) && price >= 0);
  const image = [
    ...(product.images ?? []),
    ...variants.flatMap((variant) => variant.images ?? []),
  ].find(validImage);

  // Explicit public DTO: never pass database documents, SKUs, stock counts,
  // Cloudinary public IDs or inactive variants to customer components.
  return {
    id: product._id.toString(),
    slug: product.slug,
    name: {
      ar: product.name?.ar ?? product.name?.en ?? "",
      en: product.name?.en ?? product.name?.ar ?? "",
    },
    category: product.category?.name
      ? { ar: product.category.name.ar, en: product.category.name.en }
      : null,
    price: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    image: image?.url ?? null,
    imageAlt: { ar: image?.alt?.ar ?? "", en: image?.alt?.en ?? "" },
    inStock: variants.some((variant) => variant.stock > 0),
    isNew: product.isNewArrival,
  };
}

function queryCards(filter: Record<string, unknown>, limit: number, skip = 0) {
  const query = Product.find({ ...filter, isActive: true })
    .select(
      "name slug category images.url images.alt variants.isActive variants.price variants.stock variants.images.url variants.images.alt isNewArrival",
    )
    .sort({ createdAt: -1, _id: -1 });
  return (skip ? query.skip(skip) : query)
    .limit(limit)
    .populate({
      path: "category",
      model: Category,
      select: "name -_id",
      match: { isActive: true },
    })
    .lean<PublicProduct[]>();
}

export async function getCategoryProducts(
  slug: "boys-clothing" | "girls-clothing" | "newborn-clothing",
  page: number,
) {
  await connection();
  try {
    const { connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const root = await Category.findOne({ slug, isActive: true })
      .select("_id name description")
      .lean();
    if (!root) return { title: null, description: null, products: [], totalPages: 0, error: false };

    const ids = [root._id];
    const visited = new Set([root._id.toString()]);
    let frontier = [root._id];
    while (frontier.length) {
      const children = await Category.find({ parent: { $in: frontier }, isActive: true })
        .select("_id")
        .lean();
      frontier = children.flatMap((child) => {
        const id = child._id.toString();
        if (visited.has(id)) return [];
        visited.add(id);
        return [child._id];
      });
      ids.push(...frontier);
    }

    const filter = { category: { $in: ids } };
    const pageSize = 12;
    const [count, rows] = await Promise.all([
      Product.countDocuments({ ...filter, isActive: true }),
      queryCards(filter, pageSize, (page - 1) * pageSize),
    ]);
    return {
      title: localized(root.name),
      description: localized(root.description),
      products: rows.filter((row) => row.category).map(toHomeProduct),
      totalPages: Math.ceil(count / pageSize),
      error: false,
    };
  } catch (error) {
    console.error(
      "Category products could not be loaded:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { title: null, description: null, products: [], totalPages: 0, error: true };
  }
}

export async function getNewArrivalProducts(page: number) {
  await connection();
  try {
    const { connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const categories = await Category.find({ isActive: true }).select("_id").lean();
    const filter = { category: { $in: categories.map((category) => category._id) } };
    const pageSize = 12;
    const [count, rows] = await Promise.all([
      Product.countDocuments({ ...filter, isActive: true }),
      queryCards(filter, pageSize, (page - 1) * pageSize),
    ]);
    return {
      title: null,
      description: null,
      products: rows.filter((row) => row.category).map(toHomeProduct),
      totalPages: Math.ceil(count / pageSize),
      error: false,
    };
  } catch (error) {
    console.error(
      "New arrivals could not be loaded:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { title: null, description: null, products: [], totalPages: 0, error: true };
  }
}

// React cache only deduplicates the page and metadata reads within one request.
// It does not retain prices, inventory or product visibility between requests.
export const getStorefrontProduct = cache(
  async (slug: string): Promise<StorefrontProduct | null> => {
    if (typeof slug !== "string" || slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return null;
    }
    await connection();
    try {
      const { connectDB } = await import("@/lib/db/mongoose");
      await connectDB();
      const product = await Product.findOne({ slug, isActive: true })
        .select(
          "name slug description category images.url images.alt isActive isNewArrival variants._id variants.sku variants.size variants.color variants.stock variants.price variants.compareAtPrice variants.isActive variants.images.url variants.images.alt",
        )
        .populate({
          path: "category",
          model: Category,
          select: "name slug",
          match: { isActive: true },
        })
        .lean<DetailProduct>();
      if (!product || !product.isActive) return null;

      // Only fields needed to display and select a purchasable variant cross the
      // server boundary. SKU and variant ID retain their original inventory identity.
      return {
        id: product._id.toString(),
        slug: product.slug,
        name: localized(product.name),
        description: localized(product.description),
        category: product.category
          ? {
              id: product.category._id.toString(),
              slug: product.category.slug,
              name: localized(product.category.name),
            }
          : null,
        images: publicImages(product.images),
        variants: (product.variants ?? [])
          .filter(
            (variant) => variant.isActive && Number.isFinite(variant.price) && variant.price >= 0,
          )
          .map((variant) => ({
            id: variant._id.toString(),
            sku: variant.sku,
            size: variant.size,
            color: { name: localized(variant.color?.name), hex: variant.color?.hex ?? "" },
            stock: Number.isSafeInteger(variant.stock) && variant.stock >= 0 ? variant.stock : 0,
            price: variant.price,
            compareAtPrice:
              variant.compareAtPrice != null &&
              Number.isFinite(variant.compareAtPrice) &&
              variant.compareAtPrice >= 0
                ? variant.compareAtPrice
                : null,
            images: publicImages(variant.images),
          })),
        isNew: product.isNewArrival,
      };
    } catch (error) {
      console.error(
        "Storefront product could not be loaded:",
        error instanceof Error ? error.name : "UnknownError",
      );
      throw new Error("Storefront product could not be loaded");
    }
  },
);

export async function getRelatedProducts(product: StorefrontProduct): Promise<StorefrontProducts> {
  await connection();
  try {
    const { connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const limit = 4;
    const sameCategory = product.category
      ? await queryCards({ category: product.category.id, _id: { $ne: product.id } }, limit)
      : [];
    const excluded = [product.id, ...sameCategory.map((item) => item._id.toString())];
    const others =
      sameCategory.length < limit
        ? await queryCards({ _id: { $nin: excluded } }, limit - sameCategory.length)
        : [];
    const seen = new Set([product.id]);
    const products = [...sameCategory, ...others].flatMap((item) => {
      const id = item._id.toString();
      if (seen.has(id)) return [];
      seen.add(id);
      return [toHomeProduct(item)];
    });
    return { products: products.slice(0, limit), error: false };
  } catch (error) {
    console.error(
      "Related products could not be loaded:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { products: [], error: true };
  }
}

export async function getHomeProducts(): Promise<{
  featured: StorefrontProducts;
  arrivals: StorefrontProducts;
}> {
  // No persistent cache: each home page request sees current admin changes.
  // Keep this outside the error boundary so prerendering control flow propagates.
  await connection();
  try {
    // The shared utility checks configuration at import time. Load it within
    // the boundary so missing configuration also produces the friendly error UI.
    const { connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const [featured, arrivals] = await Promise.all([
      queryCards({ isFeatured: true }, 4),
      queryCards({}, 8),
    ]);
    return {
      featured: { products: featured.map(toHomeProduct), error: false },
      arrivals: { products: arrivals.map(toHomeProduct), error: false },
    };
  } catch (error) {
    console.error(
      "Storefront products could not be loaded:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      featured: { products: [], error: true },
      arrivals: { products: [], error: true },
    };
  }
}
