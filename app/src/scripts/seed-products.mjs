import nextEnv from "@next/env";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnvConfig } = nextEnv;
const imageDirectory = resolve(process.cwd(), "seed-assets/products");

// Every entry has its own required, item-matched photo: seed-assets/products/<slug>.jpg.
// The five designs in each category are distinct catalog items, not color variants.
const designs = [
  ["striped", "مخطط", "Navy", "كحلي", "#213654"],
  ["gingham", "مربعات", "Sky Blue", "أزرق سماوي", "#8cbed6"],
  ["floral", "مزهر", "Rose", "وردي", "#d8849c"],
  ["solid", "سادة", "Cream", "كريمي", "#efe4ce"],
  ["printed", "مطبوع", "Sage", "أخضر مريمي", "#9bae9a"],
];
const collections = [
  ["boys-t-shirts", "Boys Cotton T-Shirt", "تيشيرت قطني للأولاد", "boys", "kids", 49],
  ["boys-pants", "Boys Everyday Pants", "بنطال يومي للأولاد", "boys", "kids", 79],
  ["boys-sets", "Boys Two-Piece Set", "طقم قطعتين للأولاد", "boys", "kids", 119],
  ["girls-dresses", "Girls Cotton Dress", "فستان قطني للبنات", "girls", "kids", 99],
  ["girls-tops", "Girls Everyday Top", "بلوزة يومية للبنات", "girls", "kids", 59],
  ["girls-sets", "Girls Two-Piece Set", "طقم قطعتين للبنات", "girls", "kids", 119],
  [
    "newborn-bodysuits",
    "Newborn Cotton Bodysuit",
    "سالوبيت قطني للمواليد",
    "unisex",
    "newborn",
    45,
  ],
  ["newborn-sets", "Newborn Two-Piece Set", "طقم قطعتين للمواليد", "unisex", "newborn", 89],
];

export const productPlan = collections.flatMap(
  ([categorySlug, en, ar, gender, ageGroup, price], group) =>
    designs.map(([style, styleAr, colorEn, colorAr, hex], design) => {
      const slug = `demo-${categorySlug}-${style}`;
      const sizes =
        ageGroup === "newborn"
          ? ["0-3M", "3-6M", "6-9M", "9-12M"]
          : ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"];
      return {
        slug,
        categorySlug,
        name: { en: `${style[0].toUpperCase()}${style.slice(1)} ${en}`, ar: `${ar} ${styleAr}` },
        description: {
          en: `Soft ${style} ${en.toLowerCase()} in ${colorEn.toLowerCase()}, designed for comfortable everyday wear. Demo catalog item.`,
          ar: `${ar} ${styleAr} بلون ${colorAr}، مريح للاستخدام اليومي. منتج تجريبي.`,
        },
        gender,
        ageGroup,
        price,
        color: { name: { en: colorEn, ar: colorAr }, hex },
        sizes,
        stock: 5 + ((group * 5 + design) % 9),
        imagePath: resolve(imageDirectory, `${slug}.jpg`),
      };
    }),
);

export function inspectAssets(plan = productPlan) {
  const missing = plan.filter((item) => !existsSync(item.imagePath));
  if (missing.length)
    throw new Error(
      `Missing ${missing.length} item-matched JPG product photos in seed-assets/products: ${missing.map((item) => `${item.slug}.jpg`).join(", ")}. No products were written.`,
    );
}

export function inspectCategories(categories) {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const root = bySlug.get("kids-clothing");
  const missing = [];
  if (!root || root.parent != null || !root.isActive) missing.push("kids-clothing");
  for (const groupSlug of ["boys-clothing", "girls-clothing", "newborn-clothing"]) {
    const group = bySlug.get(groupSlug);
    if (!group || !group.isActive || String(group.parent) !== String(root?._id))
      missing.push(groupSlug);
  }
  for (const item of productPlan) {
    const category = bySlug.get(item.categorySlug);
    const parentSlug =
      item.categorySlug.split("-")[0] === "newborn"
        ? "newborn-clothing"
        : `${item.categorySlug.split("-")[0]}-clothing`;
    if (
      !category ||
      !category.isActive ||
      String(category.parent) !== String(bySlug.get(parentSlug)?._id)
    )
      missing.push(item.categorySlug);
  }
  if (missing.length)
    throw new Error(
      `Missing or incorrectly nested categories: ${[...new Set(missing)].join(", ")}. Run Categories Seed first. No products were written.`,
    );
  return bySlug;
}

function variantsFor(item) {
  return item.sizes.map((size, index) => ({
    sku: `DEMO-${item.slug.slice(5).toUpperCase()}-${size.replaceAll("-", "")}`,
    size,
    color: item.color,
    stock: item.stock + (index % 3),
    price: item.price,
    isActive: true,
  }));
}

function errorDetails(value) {
  const nested = value && typeof value === "object" && "error" in value ? value.error : value;
  const message =
    nested && typeof nested === "object" && typeof nested.message === "string"
      ? nested.message
      : nested instanceof Error
        ? nested.message
        : typeof nested === "string"
          ? nested
          : "Unknown error";
  const httpCode = nested && typeof nested === "object" ? nested.http_code : undefined;
  return { message, httpCode };
}

export function formatSeedError(value, environment = process.env) {
  const { message, httpCode } = errorDetails(value);
  const stack = value instanceof Error ? value.stack : undefined;
  let output = stack || `${message}${httpCode ? ` (HTTP ${httpCode})` : ""}`;
  for (const key of [
    "MONGODB_URI",
    "CLOUDINARY_URL",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_API_KEY",
    "CLERK_SECRET_KEY",
  ]) {
    const secret = environment[key];
    if (secret) {
      output = output.replaceAll(secret, "[redacted]");
      try {
        output = output.replaceAll(encodeURIComponent(secret), "[redacted]");
      } catch {
        // Keep the literal-value redaction for malformed input.
      }
    }
  }
  return output
    .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[redacted MongoDB URI]")
    .replace(/cloudinary:\/\/[^\s]+/gi, "[redacted Cloudinary URL]")
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@[^\s]+/gi, "[redacted authenticated URL]");
}

async function main() {
  loadEnvConfig(process.cwd());
  const args = new Set(process.argv.slice(2));
  for (const arg of args)
    if (arg !== "--apply" && !arg.startsWith("--confirm-db="))
      throw new Error(`Unknown option: ${arg}`);
  const apply = args.has("--apply");
  if (apply && process.env.NODE_ENV === "production")
    throw new Error("Production writes are blocked.");
  const confirmations = [...args].filter((arg) => arg.startsWith("--confirm-db="));
  if (confirmations.length > 1) throw new Error("Provide exactly one --confirm-db option.");
  if (apply && !confirmations.length)
    throw new Error("--apply requires --confirm-db=<connected database name>.");
  if (!apply && confirmations.length) throw new Error("--confirm-db requires --apply.");
  if (apply && process.env.SEED_PRODUCTS_TARGET !== "development")
    throw new Error(
      "Set SEED_PRODUCTS_TARGET=development to apply. Production writes are blocked.",
    );
  if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI environment variable.");

  // Missing photos are a hard preflight failure, before DB or Cloudinary access.
  inspectAssets();
  const [
    { connectDB },
    { Category },
    { Product },
    { createProductSchema, validateVariantIdentities },
    { default: mongoose },
    { v2: cloudinary },
  ] = await Promise.all([
    import("../lib/db/mongoose.ts"),
    import("../models/Category.ts"),
    import("../models/Product.ts"),
    import("../lib/products/validation.ts"),
    import("mongoose"),
    import("cloudinary"),
  ]);
  try {
    try {
      await connectDB();
    } catch {
      throw new Error("Could not connect to the configured MongoDB database.");
    }
    const databaseName = mongoose.connection.db?.databaseName;
    if (!databaseName)
      throw new Error("Connected database name is unavailable. No products were written.");
    console.log(`Target database: ${databaseName}`);
    if (apply && /(^|[_-])(prod|production|live)([_-]|$)/i.test(databaseName))
      throw new Error("Production database names are blocked. No products were written.");
    if (apply && confirmations[0] !== `--confirm-db=${databaseName}`)
      throw new Error(
        "--confirm-db must match the connected database name exactly. No products were written.",
      );
    const SeedCategory = Category;
    const SeedProduct = Product;
    const categories = await SeedCategory.find({
      slug: {
        $in: [
          "kids-clothing",
          "boys-clothing",
          "girls-clothing",
          "newborn-clothing",
          ...new Set(productPlan.map((item) => item.categorySlug)),
        ],
      },
    })
      .select("_id slug parent isActive")
      .lean();
    const bySlug = inspectCategories(categories);
    const slugs = productPlan.map((item) => item.slug);
    const existing = await SeedProduct.find({ slug: { $in: slugs } })
      .select("slug variants.sku")
      .lean();
    const existingSlugs = new Set(existing.map((item) => item.slug));
    for (const product of existing) {
      const expected = variantsFor(productPlan.find((item) => item.slug === product.slug));
      if (
        product.variants.length !== expected.length ||
        expected.some((variant) => !product.variants.some((saved) => saved.sku === variant.sku))
      ) {
        throw new Error(
          `Existing product ${product.slug} conflicts with the demo identifier. No products were written.`,
        );
      }
    }
    const pending = productPlan.filter((item) => !existingSlugs.has(item.slug));
    const pendingSkus = pending.flatMap((item) => variantsFor(item).map((variant) => variant.sku));
    if (new Set(pendingSkus).size !== pendingSkus.length)
      throw new Error("Duplicate SKUs in seed plan.");
    const collisions = await SeedProduct.find({ "variants.sku": { $in: pendingSkus } })
      .select("slug variants.sku")
      .lean();
    if (collisions.length)
      throw new Error(
        `SKU conflict with existing products: ${collisions.map((item) => item.slug).join(", ")}. No products were written.`,
      );

    // Validate every planned document against both API input and Mongoose before uploads or inserts.
    for (const item of productPlan) {
      const input = {
        name: item.name,
        slug: item.slug,
        description: item.description,
        category: String(bySlug.get(item.categorySlug)._id),
        images: [
          {
            url: "https://example.invalid/preflight.jpg",
            publicId: "preflight",
            alt: item.name,
          },
        ],
        variants: variantsFor(item),
        gender: item.gender,
        ageGroup: item.ageGroup,
        isActive: true,
      };
      createProductSchema.parse(input);
      validateVariantIdentities(input.variants);
      await new SeedProduct(input).validate();
    }
    console.log(
      `Prepared ${productPlan.length} products; ${existing.length} reused; ${pending.length} pending. Images: ${imageDirectory}`,
    );
    if (!apply) {
      console.log(
        `Dry run only. To insert, set SEED_PRODUCTS_TARGET=development and run npm run seed:products -- --apply --confirm-db=${databaseName}.`,
      );
      return;
    }

    try {
      await SeedProduct.createIndexes();
    } catch (error) {
      throw new Error(`Product index creation failed: ${errorDetails(error).message}`);
    }
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud_name || !api_key || !api_secret)
      throw new Error("Cloudinary credentials are required before applying.");
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    let inserted = 0;
    let uploaded = 0;
    let reusedImages = 0;
    for (const item of pending) {
      const publicId = `aylol-nest/products/${item.slug}`;
      let resource;
      try {
        resource = await cloudinary.api.resource(publicId, { resource_type: "image" });
      } catch (error) {
        const { message, httpCode } = errorDetails(error);
        if (httpCode !== 404)
          throw new Error(
            `Cloudinary lookup failed for ${item.slug}${httpCode ? ` (HTTP ${httpCode})` : ""}: ${message}`,
          );
      }
      if (!resource) {
        try {
          resource = await cloudinary.uploader.upload(item.imagePath, {
            public_id: item.slug,
            folder: "aylol-nest/products",
            overwrite: false,
            resource_type: "image",
          });
        } catch (error) {
          const { message, httpCode } = errorDetails(error);
          throw new Error(
            `Cloudinary upload failed for ${item.slug}${httpCode ? ` (HTTP ${httpCode})` : ""}: ${message}`,
          );
        }
        uploaded++;
      } else reusedImages++;
      if (
        resource.public_id !== publicId ||
        !resource.secure_url?.startsWith("https://res.cloudinary.com/")
      )
        throw new Error(`Invalid Cloudinary result for ${item.slug}`);
      const input = createProductSchema.parse({
        name: item.name,
        slug: item.slug,
        description: item.description,
        category: String(bySlug.get(item.categorySlug)._id),
        images: [{ url: resource.secure_url, publicId: resource.public_id, alt: item.name }],
        variants: variantsFor(item),
        gender: item.gender,
        ageGroup: item.ageGroup,
        isActive: true,
      });
      const result = await SeedProduct.updateOne(
        { slug: item.slug },
        { $setOnInsert: input },
        { upsert: true, runValidators: true },
      );
      inserted += result.upsertedCount;
    }
    console.log(
      `Inserted ${inserted}; reused ${existing.length + pending.length - inserted}; Cloudinary uploaded ${uploaded}, reused ${reusedImages}.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error("Product seed failed:", formatSeedError(error));
    process.exitCode = 1;
  });
}
