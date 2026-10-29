import nextEnv from "@next/env";
import { pathToFileURL } from "node:url";

const { loadEnvConfig } = nextEnv;

const ROOT_SLUG = "kids-clothing";

const groups = [
  {
    slug: "boys-clothing",
    name: { en: "Boys Clothing", ar: "ملابس أولاد" },
    audience: { en: "boys", ar: "للأولاد" },
    description: {
      en: "Clothing and everyday outfits for boys.",
      ar: "ملابس وأطقم يومية للأولاد.",
    },
    sortOrder: 10,
    children: [
      ["boys-t-shirts", "T-Shirts", "تيشيرتات"],
      ["boys-shirts", "Shirts", "قمصان"],
      ["boys-pants", "Pants", "بناطيل"],
      ["boys-jeans", "Jeans", "جينز"],
      ["boys-sets", "Sets", "أطقم"],
      ["boys-jackets", "Jackets", "جاكيتات"],
      ["boys-pajamas", "Pajamas", "بيجامات"],
    ],
  },
  {
    slug: "girls-clothing",
    name: { en: "Girls Clothing", ar: "ملابس بنات" },
    audience: { en: "girls", ar: "للبنات" },
    description: {
      en: "Clothing and everyday outfits for girls.",
      ar: "ملابس وأطقم يومية للبنات.",
    },
    sortOrder: 20,
    children: [
      ["girls-dresses", "Dresses", "فساتين"],
      ["girls-t-shirts", "T-Shirts", "تيشيرتات"],
      ["girls-tops", "Tops", "بلوزات"],
      ["girls-pants", "Pants", "بناطيل"],
      ["girls-sets", "Sets", "أطقم"],
      ["girls-jackets", "Jackets", "جاكيتات"],
      ["girls-pajamas", "Pajamas", "بيجامات"],
    ],
  },
  {
    slug: "newborn-clothing",
    name: { en: "Newborn Clothing", ar: "ملابس مواليد" },
    audience: { en: "newborns", ar: "للمواليد" },
    description: {
      en: "Soft clothing and essentials for newborns.",
      ar: "ملابس ناعمة ومستلزمات لحديثي الولادة.",
    },
    sortOrder: 30,
    children: [
      ["newborn-bodysuits", "Bodysuits", "سالوبيتات"],
      ["newborn-sets", "Sets", "أطقم"],
      ["newborn-sleepwear", "Sleepwear", "ملابس نوم"],
      ["newborn-accessories", "Accessories", "إكسسوارات"],
    ],
  },
];

export const categoryPlan = groups.flatMap((group) => [
  {
    slug: group.slug,
    name: group.name,
    description: group.description,
    parentSlug: ROOT_SLUG,
    sortOrder: group.sortOrder,
  },
  ...group.children.map(([slug, en, ar], index) => ({
    slug,
    name: { en, ar },
    description: {
      en: `Shop ${en.toLowerCase()} for ${group.audience.en}.`,
      ar: `تسوق ${ar} ${group.audience.ar}.`,
    },
    parentSlug: group.slug,
    sortOrder: (index + 1) * 10,
  })),
]);

function sameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

function checkExisting(existing, parentId, slug) {
  if (existing && !sameId(existing.parent, parentId)) {
    throw new Error(
      `Category "${slug}" already exists under a different parent. No existing data was changed.`,
    );
  }
}

export function inspectPlan(root, existing) {
  if (!root)
    throw new Error(`Required root category "${ROOT_SLUG}" does not exist. Nothing was inserted.`);
  if (root.parent != null || !root.isActive)
    throw new Error(`Category "${ROOT_SLUG}" is not an active root. Nothing was inserted.`);
  const bySlug = new Map(existing.map((item) => [item.slug, item]));
  if (bySlug.size !== existing.length) {
    throw new Error("Duplicate planned slugs already exist in the database. Nothing was inserted.");
  }
  for (const item of categoryPlan) {
    const category = bySlug.get(item.slug);
    if (!category) continue;
    const parentId = item.parentSlug === ROOT_SLUG ? root._id : bySlug.get(item.parentSlug)?._id;
    if (!parentId)
      throw new Error(
        `Category "${item.slug}" exists but its planned parent "${item.parentSlug}" does not. Nothing was inserted.`,
      );
    checkExisting(category, parentId, item.slug);
  }
  return bySlug;
}

async function main() {
  loadEnvConfig(process.cwd());

  const args = new Set(process.argv.slice(2));
  const allowed = new Set(["--apply", "--allow-production"]);
  for (const arg of args) if (!allowed.has(arg)) throw new Error(`Unknown option: ${arg}`);
  const apply = args.has("--apply");
  const target = process.env.SEED_CATEGORIES_TARGET;
  if (apply && target !== "development" && target !== "production") {
    throw new Error("Set SEED_CATEGORIES_TARGET=development or production before applying writes.");
  }
  const production = process.env.NODE_ENV === "production" || target === "production";
  if (
    apply &&
    production &&
    !(args.has("--allow-production") && process.env.SEED_CATEGORIES_ALLOW_PRODUCTION === "1")
  ) {
    throw new Error(
      "Production writes are blocked. Explicit authorization requires --allow-production and SEED_CATEGORIES_ALLOW_PRODUCTION=1.",
    );
  }
  if (args.has("--allow-production") && !apply)
    throw new Error("--allow-production requires --apply");

  // Import after loading .env.local: connectDB checks MONGODB_URI at module load.
  const [{ connectDB }, { Category }, { default: mongoose }] = await Promise.all([
    import("../lib/db/mongoose.ts"),
    import("../models/Category.ts"),
    import("mongoose"),
  ]);

  try {
    await connectDB();
    const root = await Category.findOne({ slug: ROOT_SLUG }).select("_id parent isActive").lean();

    // Validate every existing slug before writing anything. An existing category
    // with the wrong parent is a conflict, never a record for this script to repair.
    const existing = await Category.find({ slug: { $in: categoryPlan.map((item) => item.slug) } })
      .select("_id slug parent")
      .lean();
    inspectPlan(root, existing);

    if (!apply) {
      console.log(
        `Dry run: reused root ${ROOT_SLUG}; ${existing.length} existing child categories would be reused; ${categoryPlan.length - existing.length} categories would be inserted.`,
      );
      console.log("Run npm run seed:categories -- --apply to insert missing categories.");
      return;
    }

    await Category.createIndexes();
    const ids = new Map([[ROOT_SLUG, root._id]]);
    const inserted = [];
    const reused = [ROOT_SLUG];
    for (const item of categoryPlan) {
      const parent = ids.get(item.parentSlug);
      if (!parent) throw new Error(`Missing parent for ${item.slug}`);
      const result = await Category.updateOne(
        { slug: item.slug },
        {
          $setOnInsert: {
            slug: item.slug,
            name: item.name,
            description: item.description,
            imageUrl: "",
            parent,
            sortOrder: item.sortOrder,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, runValidators: true, timestamps: false },
      );
      const category = await Category.findOne({ slug: item.slug }).select("_id parent").lean();
      if (!category) throw new Error(`Category ${item.slug} could not be read after upsert`);
      checkExisting(category, parent, item.slug);
      ids.set(item.slug, category._id);
      (result.upsertedCount ? inserted : reused).push(item.slug);
    }
    console.log(`Inserted (${inserted.length}): ${inserted.join(", ") || "none"}`);
    console.log(`Reused (${reused.length}): ${reused.join(", ")}`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error("Category seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
