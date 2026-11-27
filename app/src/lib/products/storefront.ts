import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { Category, type ICategory } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";
import type { HomeProduct } from "@/lib/home-data";
import type { LocalizedText } from "@/types/category";
import type { StorefrontImage, StorefrontProduct } from "@/types/storefront";
import { ExploreSelection } from "@/models/ExploreSelection";

export type StorefrontProducts = { products: HomeProduct[]; error: boolean };

type PublicImage = Pick<IProduct["images"][number], "url" | "alt">;
type PublicVariant = Pick<IProduct["variants"][number], "_id" | "isActive" | "price" | "stock"> & {
  images: PublicImage[];
};
type PublicProduct = Pick<IProduct, "name" | "slug" | "isNewArrival"> & {
  _id: { toString(): string };
  category: Pick<ICategory, "name"> | null;
  images: PublicImage[];
  variants: PublicVariant[];
};

type ExploreCardProduct = Omit<PublicProduct, "category" | "variants"> & {
  category: (Pick<ICategory, "name"> & { _id: { toString(): string } }) | null;
  createdAt: Date;
  variants: (PublicVariant & { size: string; color: { name: LocalizedText } })[];
};

export type ExploreFilters = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  availability?: "in" | "out";
  sort?: "selected" | "newest" | "priceAsc" | "priceDesc" | "name";
  page: number;
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
    quickAddVariantId:
      variants.length === 1 && variants[0].stock > 0 ? variants[0]._id.toString() : undefined,
    isNew: product.isNewArrival,
  };
}

const newestFirst = { createdAt: -1, _id: -1 } as const;
const homeDisplayOrder = { sortOrder: 1, ...newestFirst } as const;

function queryCards(
  filter: Record<string, unknown>,
  limit: number,
  skip = 0,
  sort: typeof newestFirst | typeof homeDisplayOrder = newestFirst,
) {
  const query = Product.find({ ...filter, isActive: true })
    .select(
      "name slug category images.url images.alt variants.isActive variants.price variants.stock variants.images.url variants.images.alt isNewArrival",
    )
    .sort(sort);
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

export async function getExploreProducts(filters: ExploreFilters, locale: "ar" | "en") {
  await connection();
  try {
    const { connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const selection = await ExploreSelection.findById("explore").select("productIds").lean();
    const ids = selection?.productIds.map(String) ?? [];
    if (!ids.length) return { products: [], categories: [], totalPages: 0, total: 0, error: false };
    const rows = await Product.find({ _id: { $in: ids }, isActive: true })
      .select(
        "name slug category images.url images.alt variants.isActive variants.price variants.stock variants.size variants.color.name variants.images.url variants.images.alt isNewArrival createdAt",
      )
      .populate({ path: "category", model: Category, select: "name", match: { isActive: true } })
      .lean<ExploreCardProduct[]>();
    const byId = new Map(
      rows.filter((row) => row.category).map((row) => [row._id.toString(), row]),
    );
    const ordered = ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [row] : [];
    });
    const categories = [
      ...new Map(
        ordered.map((row) => [
          row.category!._id.toString(),
          {
            id: row.category!._id.toString(),
            name: localized(row.category!.name),
          },
        ]),
      ).values(),
    ];
    const search = filters.search?.trim().toLocaleLowerCase() ?? "";
    const size = filters.size?.trim().toLocaleLowerCase() ?? "";
    const color = filters.color?.trim().toLocaleLowerCase() ?? "";
    const matches = ordered.filter((row) => {
      if (
        search &&
        ![localized(row.name).ar, localized(row.name).en].some((name) =>
          name.toLocaleLowerCase().includes(search),
        )
      )
        return false;
      if (filters.category && row.category?._id.toString() !== filters.category) return false;
      const variants = row.variants.filter(
        (variant) =>
          variant.isActive &&
          Number.isFinite(variant.price) &&
          (!size || variant.size?.toLocaleLowerCase().includes(size)) &&
          (!color ||
            [variant.color?.name?.ar, variant.color?.name?.en].some((name) =>
              name?.toLocaleLowerCase().includes(color),
            )) &&
          (filters.minPrice === undefined || variant.price >= filters.minPrice) &&
          (filters.maxPrice === undefined || variant.price <= filters.maxPrice),
      );
      return (
        variants.length > 0 &&
        (filters.availability !== "in" || variants.some((variant) => variant.stock > 0)) &&
        (filters.availability !== "out" || variants.every((variant) => variant.stock <= 0))
      );
    });
    if (filters.sort && filters.sort !== "selected")
      matches.sort((a, b) => {
        if (filters.sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
        if (filters.sort === "name")
          return localized(a.name)[locale].localeCompare(localized(b.name)[locale], locale);
        const price = (row: ExploreCardProduct) =>
          Math.min(...row.variants.filter((v) => v.isActive).map((v) => v.price));
        return filters.sort === "priceAsc" ? price(a) - price(b) : price(b) - price(a);
      });
    const pageSize = 12;
    const start = (filters.page - 1) * pageSize;
    return {
      products: matches.slice(start, start + pageSize).map(toHomeProduct),
      categories,
      totalPages: Math.ceil(matches.length / pageSize),
      total: matches.length,
      error: false,
    };
  } catch (error) {
    console.error(
      "Explore products could not be loaded:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { products: [], categories: [], totalPages: 0, total: 0, error: true };
  }
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
      queryCards({ isFeatured: true }, 4, 0, homeDisplayOrder),
      queryCards({}, 8, 0, homeDisplayOrder),
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
