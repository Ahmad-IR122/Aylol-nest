import "server-only";

import { connection } from "next/server";
import { Category, type ICategory } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";
import type { HomeProduct } from "@/lib/home-data";

export type StorefrontProducts = { products: HomeProduct[]; error: boolean };

type PublicImage = Pick<IProduct["images"][number], "url" | "alt">;
type PublicVariant = Pick<IProduct["variants"][number], "isActive" | "price" | "stock"> & {
  images: PublicImage[];
};
type PublicProduct = Pick<IProduct, "name" | "isNewArrival"> & {
  _id: { toString(): string };
  category: Pick<ICategory, "name"> | null;
  images: PublicImage[];
  variants: PublicVariant[];
};

function validImage(image: PublicImage) {
  try {
    const url = new URL(image.url);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
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
    const query = (featured: boolean, limit: number) =>
      Product.find({ isActive: true, ...(featured ? { isFeatured: true } : {}) })
        .select(
          "name category images.url images.alt variants.isActive variants.price variants.stock variants.images.url variants.images.alt isNewArrival",
        )
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .populate({
          path: "category",
          model: Category,
          select: "name -_id",
          match: { isActive: true },
        })
        .lean<PublicProduct[]>();
    const [featured, arrivals] = await Promise.all([query(true, 4), query(false, 8)]);
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
