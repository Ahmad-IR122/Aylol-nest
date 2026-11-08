import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, mock, test } from "node:test";
import ts from "typescript";

// Exercise the real data layer and rendered components. Only request context
// and database I/O are mocked; this suite never changes a live catalog.
const sourceRoot = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === "server-only" ||
      specifier === "next/server" ||
      specifier === "next-intl/plugin"
    )
      return { url: `storefront-test:${specifier}`, shortCircuit: true };
    if (specifier === "next/navigation" || specifier === "next/link")
      return nextResolve(`${specifier}.js`, context);
    let candidate;
    if (specifier.startsWith("@/")) candidate = new URL(specifier.slice(2), sourceRoot);
    else if (specifier.startsWith(".") && context.parentURL?.startsWith(sourceRoot.href))
      candidate = new URL(specifier, context.parentURL);
    if (candidate && !/\.[cm]?[jt]sx?$/.test(candidate.pathname)) {
      for (const extension of [".ts", ".tsx"]) {
        const url = new URL(candidate.href + extension);
        if (existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    // The build plugin's native SWC dependency is unrelated to these runtime
    // tests; keep the actual next.config image configuration without loading it.
    if (url === "storefront-test:next-intl/plugin")
      return {
        format: "commonjs",
        shortCircuit: true,
        source: "module.exports = () => config => config;",
      };
    if (url.startsWith("storefront-test:"))
      return {
        format: "commonjs",
        shortCircuit: true,
        source: "exports.connection = async () => {};",
      };
    if (url === new URL("lib/db/mongoose.ts", sourceRoot).href)
      return {
        format: "commonjs",
        shortCircuit: true,
        source: "exports.connectDB = async () => {};",
      };
    if (
      (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(url)) ||
      url === new URL("../next.config.ts", import.meta.url).href
    )
      return {
        format: "commonjs",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
          },
          fileName: fileURLToPath(url),
        }).outputText,
      };
    return nextLoad(url, context);
  },
});

const require = createRequire(import.meta.url);
const { Product } = require("../src/models/Product.ts");
const { Category } = require("../src/models/Category.ts");
const {
  getHomeProducts,
  getStorefrontProduct,
  getRelatedProducts,
  getCategoryProducts,
} = require("../src/lib/products/storefront.ts");
const db = require("../src/lib/db/mongoose.ts");
const requestContext = require("next/server");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextIntlClientProvider } = require("next-intl");
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const nextConfig = require("../next.config.ts").default;
const {
  ProductCard,
  default: FeaturedProducts,
} = require("../src/components/home/FeaturedProducts.tsx");
const NewArrivals = require("../src/components/home/NewArrivals.tsx").default;
const messages = Object.fromEntries(
  ["en", "ar"].map((locale) => [
    locale,
    JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")),
  ]),
);
const image = {
  url: "https://res.cloudinary.com/test/image/upload/test.jpg",
  publicId: "private-media-id",
  alt: { ar: "طقم قطني", en: "Cotton outfit" },
};
const row = (id = "1", overrides = {}) => ({
  _id: id,
  slug: `outfit-${id}`,
  name: { ar: "طقم أطفال", en: "Kids outfit" },
  description: { ar: "ملابس مريحة", en: "Comfortable clothing" },
  category: { _id: "category-1", slug: "kids", name: { ar: "أطفال", en: "Kids" } },
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  createdAt: Number(id),
  images: [image],
  variants: [
    {
      _id: "variant-1",
      isActive: true,
      price: 95.5,
      compareAtPrice: 120,
      stock: 2,
      images: [],
      sku: "PRIVATE-SKU",
      size: "2Y",
      color: { name: { ar: "وردي", en: "Pink" }, hex: "#ddaaaa" },
    },
    { isActive: true, price: 120, stock: 0, images: [] },
    { isActive: false, price: 1, stock: 100, images: [] },
  ],
  ...overrides,
});

function catalog(rows) {
  return mock.method(Product, "find", (filter) => {
    assert.equal(filter.isActive, true, "public queries must explicitly require active products");
    let limit;
    return {
      select(projection) {
        assert.ok(projection.includes("variants.isActive"));
        assert.ok(!projection.includes("sku") && !projection.includes("publicId"));
        return this;
      },
      sort(order) {
        assert.deepEqual(order, { createdAt: -1, _id: -1 });
        return this;
      },
      limit(value) {
        limit = value;
        return this;
      },
      populate(options) {
        assert.equal(options.path, "category");
        assert.deepEqual(options.match, { isActive: true });
        return this;
      },
      async lean() {
        return rows
          .filter((item) =>
            Object.entries(filter).every(([key, value]) => {
              if (key === "category") return item.category?._id === value;
              if (key === "_id" && value.$ne) return item._id !== value.$ne;
              if (key === "_id" && value.$nin) return !value.$nin.includes(item._id);
              return item[key] === value;
            }),
          )
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit);
      },
    };
  });
}

function render(Component, props, locale = "en") {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      { locale, messages: messages[locale], timeZone: "UTC" },
      React.createElement(
        ImageConfigContext.Provider,
        { value: { ...imageConfigDefault, ...nextConfig.images } },
        React.createElement(Component, props),
      ),
    ),
  );
}
afterEach(() => mock.restoreAll());

test("home queries are bounded, newest first, active-only, and featured flags are respected", async () => {
  const rows = Array.from({ length: 12 }, (_, i) =>
    row(String(i + 1), { isFeatured: i % 2 === 0 }),
  );
  rows.push(row("99", { isActive: false, isFeatured: true }));
  catalog(rows);
  const result = await getHomeProducts();
  assert.equal(result.arrivals.products.length, 8);
  assert.deepEqual(
    result.arrivals.products.map((p) => p.id),
    ["12", "11", "10", "9", "8", "7", "6", "5"],
  );
  assert.deepEqual(
    result.featured.products.map((p) => p.id),
    ["11", "9", "7", "5"],
  );
  assert.equal(result.arrivals.products[0].isNew, false, "newest unflagged products still appear");
});

test("public cards derive price, stock and images from active variants without leaking internal data", async () => {
  catalog([
    row("1", {
      images: [{ ...image, url: "javascript:alert(1)" }],
      variants: [
        { isActive: false, price: 1, stock: 100, images: [image] },
        { isActive: true, price: 95.5, stock: 0, images: [image] },
      ],
    }),
  ]);
  const product = (await getHomeProducts()).arrivals.products[0];
  assert.equal(product.price, 95.5);
  assert.equal(product.maxPrice, 95.5);
  assert.equal(product.inStock, false);
  assert.equal(product.image, image.url);
  assert.equal(product.imageAlt.ar, image.alt.ar);
  assert.deepEqual(
    Object.keys(product).sort(),
    [
      "id",
      "slug",
      "name",
      "category",
      "price",
      "maxPrice",
      "image",
      "imageAlt",
      "inStock",
      "isNew",
    ].sort(),
  );
  assert.doesNotMatch(
    JSON.stringify(product),
    /publicId|private-media-id|PRIVATE-SKU|variants|createdAt/,
  );
});

test("missing categories, malformed images and entirely retired variants remain safe", async () => {
  catalog([
    row("1", {
      category: null,
      images: [{ ...image, url: "https://user:password@example.test/a.jpg" }],
      variants: [{ isActive: false, stock: 3, price: 10, images: [image] }],
    }),
  ]);
  const product = (await getHomeProducts()).arrivals.products[0];
  assert.equal(product.category, null);
  assert.equal(product.image, null);
  assert.equal(product.price, null);
  assert.equal(product.inStock, false);
  assert.match(render(ProductCard, { product }), /Currently unavailable/);
});

test("each request reflects create, edit, deactivate, reactivate and delete", async () => {
  const rows = [];
  catalog(rows);
  assert.equal((await getHomeProducts()).arrivals.products.length, 0);
  rows.push(row());
  assert.equal((await getHomeProducts()).arrivals.products.length, 1);
  rows[0].name.en = "Edited outfit";
  rows[0].variants[0].price = 80;
  let product = (await getHomeProducts()).arrivals.products[0];
  assert.equal(product.name.en, "Edited outfit");
  assert.equal(product.price, 80);
  rows[0].isActive = false;
  assert.equal((await getHomeProducts()).arrivals.products.length, 0);
  rows[0].isActive = true;
  assert.equal((await getHomeProducts()).arrivals.products.length, 1);
  rows.splice(0, 1);
  assert.equal((await getHomeProducts()).arrivals.products.length, 0);
});

test("database failures are distinguishable from an empty catalog and never disclose error details", async () => {
  mock.method(console, "error", () => {});
  mock.method(db, "connectDB", async () => {
    throw new Error("SECRET database URI");
  });
  const result = await getHomeProducts();
  assert.deepEqual(result.arrivals, { products: [], error: true });
  const html = render(NewArrivals, result.arrivals);
  assert.match(html, /Products could not be loaded/);
  assert.doesNotMatch(html, /SECRET|No products are available/);
});

test("request-time rendering signals are not swallowed as database errors", async () => {
  const signal = new Error("prerender control flow");
  mock.method(requestContext, "connection", async () => {
    throw signal;
  });
  await assert.rejects(getHomeProducts, (error) => error === signal);
});

test("both locales render real names, ILS, availability, empty states and localized product links", async () => {
  catalog([row("1", { isNewArrival: true })]);
  const product = (await getHomeProducts()).arrivals.products[0];
  for (const locale of ["en", "ar"]) {
    const html = render(ProductCard, { product }, locale);
    assert.ok(html.includes(product.name[locale]));
    assert.ok(html.includes("₪"));
    assert.ok(html.includes(messages[locale].StorefrontProducts.inStock));
    assert.ok(html.includes(image.alt[locale]));
    assert.ok(html.includes(`href="/${locale}/products/${product.slug}"`));
    const empty = render(NewArrivals, { products: [], error: false }, locale);
    assert.ok(empty.includes(messages[locale].StorefrontProducts.empty));
    assert.ok(empty.includes(messages[locale].StorefrontProducts.arrivalsTitle));
    assert.doesNotMatch(
      render(FeaturedProducts, { products: [], error: false }, locale),
      /demo-|href=/,
    );
  }
});

function detailCatalog(rows) {
  return mock.method(Product, "findOne", (filter) => {
    assert.equal(filter.isActive, true);
    return {
      select(projection) {
        assert.ok(projection.includes("variants.sku"));
        assert.ok(projection.includes("variants._id"));
        assert.ok(!projection.includes("publicId"));
        return this;
      },
      populate(options) {
        assert.deepEqual(options.match, { isActive: true });
        return this;
      },
      async lean() {
        return rows.find((item) => item.slug === filter.slug && item.isActive) ?? null;
      },
    };
  });
}

test("product details reject malformed slugs before database access and hide missing/inactive products", async () => {
  const find = detailCatalog([row("1", { isActive: false })]);
  const connect = mock.method(db, "connectDB", async () => {});
  for (const slug of ["", "../admin", "Bad-Slug", "a%2fb", "x".repeat(201), "a--b"]) {
    assert.equal(await getStorefrontProduct(slug), null);
  }
  assert.equal(connect.mock.callCount(), 0);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(await getStorefrontProduct("outfit-1"), null);
  assert.equal(await getStorefrontProduct("missing-product"), null);
});

test("detail DTO retains exact active variant identity, inventory and prices without media/database internals", async () => {
  const product = row("1");
  product.variants = [
    { ...product.variants[0], images: [image], __v: 7 },
    { ...product.variants[0], _id: "inactive", sku: "INACTIVE-SKU", isActive: false },
    { ...product.variants[0], _id: "broken-price", price: NaN },
  ];
  product.images = [image, image, { ...image, url: "http://insecure.test/image.jpg" }];
  product.__v = 5;
  detailCatalog([product]);
  const result = await getStorefrontProduct(product.slug);
  assert.equal(result.slug, product.slug);
  assert.equal(result.description.en, product.description.en);
  assert.deepEqual(result.category, {
    id: "category-1",
    slug: "kids",
    name: product.category.name,
  });
  assert.equal(result.images.length, 1);
  assert.deepEqual(result.variants, [
    {
      id: "variant-1",
      sku: "PRIVATE-SKU",
      size: "2Y",
      color: product.variants[0].color,
      stock: 2,
      price: 95.5,
      compareAtPrice: 120,
      images: [{ url: image.url, alt: image.alt }],
    },
  ]);
  assert.doesNotMatch(
    JSON.stringify(result),
    /publicId|private-media-id|__v|createdAt|INACTIVE-SKU|broken-price/,
  );
  assert.equal(JSON.stringify(result).includes('"_id"'), false);
});

test("details safely support missing categories/images and all-retired variants", async () => {
  detailCatalog([row("1", { category: null, images: [], variants: [{ isActive: false }] })]);
  const result = await getStorefrontProduct("outfit-1");
  assert.equal(result.category, null);
  assert.deepEqual(result.images, []);
  assert.deepEqual(result.variants, []);
});

test("related products prioritize the same category, fill from active catalog, and exclude current or duplicate IDs", async () => {
  catalog([
    row("1"),
    row("2"),
    row("3"),
    row("4", { category: null }),
    row("5", { category: null }),
    row("6", { isActive: false }),
  ]);
  const result = await getRelatedProducts({ id: "1", category: { id: "category-1" } });
  assert.equal(result.error, false);
  assert.deepEqual(
    result.products.map((item) => item.id),
    ["3", "2", "5", "4"],
  );
  assert.equal(new Set(result.products.map((item) => item.id)).size, 4);
});

test("related queries are bounded and skip fallback when the category fills the grid", async () => {
  const find = catalog(Array.from({ length: 8 }, (_, index) => row(String(index + 1))));
  const result = await getRelatedProducts({ id: "1", category: { id: "category-1" } });
  assert.equal(result.products.length, 4);
  assert.equal(find.mock.callCount(), 1);
});

test("related products without an active category fall back to the active catalog", async () => {
  const find = catalog([row("1"), row("2"), row("3", { isActive: false })]);
  const result = await getRelatedProducts({ id: "1", category: null });
  assert.deepEqual(
    result.products.map((item) => item.id),
    ["2"],
  );
  assert.equal(find.mock.callCount(), 1);
});

test("detail failures remain server errors, related failures remain isolated, and request rendering signals propagate", async () => {
  mock.method(console, "error", () => {});
  mock.method(db, "connectDB", async () => {
    throw new Error("SECRET URI");
  });
  await assert.rejects(getStorefrontProduct("outfit-1"), {
    message: "Storefront product could not be loaded",
  });
  assert.deepEqual(await getRelatedProducts({ id: "1", category: null }), {
    products: [],
    error: true,
  });
  const signal = new Error("prerender control flow");
  mock.method(requestContext, "connection", async () => {
    throw signal;
  });
  await assert.rejects(
    () => getStorefrontProduct("outfit-1"),
    (error) => error === signal,
  );
  await assert.rejects(
    () => getRelatedProducts({ id: "1", category: null }),
    (error) => error === signal,
  );
});

test("boys and girls listings include active descendants and exclude other or inactive branches", async () => {
  const categories = [
    {
      _id: "boys",
      slug: "boys-clothing",
      parent: null,
      isActive: true,
      name: { en: "Boys Clothing", ar: "ملابس أولاد" },
    },
    { _id: "boys-child", parent: "boys", isActive: true },
    { _id: "boys-grandchild", parent: "boys-child", isActive: true },
    { _id: "boys-inactive", parent: "boys", isActive: false },
    { _id: "boys-hidden-child", parent: "boys-inactive", isActive: true },
    {
      _id: "girls",
      slug: "girls-clothing",
      parent: null,
      isActive: true,
      name: { en: "Girls Clothing", ar: "ملابس بنات" },
    },
    { _id: "girls-child", parent: "girls", isActive: true },
  ];
  const products = [
    row("boys-root", { category: { _id: "boys", name: categories[0].name } }),
    row("boys-nested", { category: { _id: "boys-grandchild", name: categories[0].name } }),
    row("boys-hidden", { category: { _id: "boys-hidden-child", name: categories[0].name } }),
    row("girls-child", { category: { _id: "girls-child", name: categories[5].name } }),
    row("girls-inactive-product", {
      category: { _id: "girls", name: categories[5].name },
      isActive: false,
    }),
  ];
  mock.method(Category, "findOne", (filter) => ({
    select() {
      return this;
    },
    async lean() {
      return categories.find((item) => item.slug === filter.slug && item.isActive) ?? null;
    },
  }));
  mock.method(Category, "find", (filter) => ({
    select() {
      return this;
    },
    async lean() {
      return categories.filter((item) => item.isActive && filter.parent.$in.includes(item.parent));
    },
  }));
  const matching = (filter) =>
    products.filter((item) => item.isActive && filter.category.$in.includes(item.category._id));
  mock.method(Product, "countDocuments", async (filter) => matching(filter).length);
  mock.method(Product, "find", (filter) => ({
    offset: 0,
    select() {
      return this;
    },
    sort() {
      return this;
    },
    skip(value) {
      this.offset = value;
      return this;
    },
    limit(value) {
      this.max = value;
      return this;
    },
    populate() {
      return this;
    },
    async lean() {
      return matching(filter).slice(this.offset, this.offset + this.max);
    },
  }));

  const boys = await getCategoryProducts("boys-clothing", 1);
  const girls = await getCategoryProducts("girls-clothing", 1);
  assert.equal(boys.title.en, "Boys Clothing");
  assert.deepEqual(
    boys.products.map((item) => item.slug),
    ["outfit-boys-root", "outfit-boys-nested"],
  );
  assert.equal(girls.title.ar, "ملابس بنات");
  assert.deepEqual(
    girls.products.map((item) => item.slug),
    ["outfit-girls-child"],
  );
});
