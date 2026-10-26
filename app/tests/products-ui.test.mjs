import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, mock, test } from "node:test";
import ts from "typescript";

// Compile only application modules in-memory; reuse installed React/Next/intl.
// No browser, auth bypass, database access or generated production files.
const sourceRoot = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
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
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(url)) {
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
    }
    return nextLoad(url, context);
  },
});
const require = createRequire(import.meta.url);
const {
  productForm,
  productPayload,
  newVariant,
  availableStock,
  productPrice,
} = require("../src/lib/products/form.ts");
const { productRequest, productErrorCode } = require("../src/lib/products/client.ts");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextIntlClientProvider } = require("next-intl");
const ProductsManager = require("../src/components/admin/products/ProductsManager.tsx").default;
const ProductsTable = require("../src/components/admin/products/ProductsTable.tsx").default;
const ProductVariantsEditor =
  require("../src/components/admin/products/ProductVariantsEditor.tsx").default;
const ProductImagesManager =
  require("../src/components/admin/products/ProductImagesManager.tsx").default;
const en = JSON.parse(readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"));
const ar = JSON.parse(readFileSync(new URL("../messages/ar.json", import.meta.url), "utf8"));
const product = {
  _id: "507f1f77bcf86cd799439011",
  name: { ar: "طقم شتوي", en: "Winter set" },
  description: { ar: "دافئ", en: "Warm" },
  slug: "winter-set",
  category: { _id: "507f1f77bcf86cd799439012", name: { ar: "أطقم", en: "Sets" }, slug: "sets" },
  images: [],
  gender: "unisex",
  ageGroup: "toddler",
  isActive: true,
  isFeatured: false,
  isNewArrival: true,
  sortOrder: 0,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-02T10:00:00.000Z",
  variants: [
    {
      _id: "507f1f77bcf86cd799439013",
      sku: "WINTER-2Y",
      size: "2Y",
      color: { name: { ar: "بيج", en: "Beige" }, hex: "#eeddbb" },
      stock: 5,
      price: 120,
      compareAtPrice: 150,
      images: [],
      isActive: true,
    },
  ],
};
afterEach(() => mock.restoreAll());

test("unchanged forms produce no mutation; name edits do not resend inventory or other languages", () => {
  const form = productForm(product);
  assert.equal(productPayload(form, product), null);
  form.name.en = "Updated winter set";
  assert.deepEqual(productPayload(form, product), { name: { en: "Updated winter set" } });
  assert.equal(product.name.en, "Winter set");
});

test("inventory and color edits preserve IDs and only send changed fields", () => {
  const form = productForm(product);
  form.variants[0].stock = 8;
  form.variants[0].color.name.en = "Sand";
  assert.deepEqual(productPayload(form, product), {
    variants: [{ _id: product.variants[0]._id, stock: 8, color: { name: { en: "Sand" } } }],
  });
  assert.equal(product.variants[0].stock, 5);
});

test("new variants omit client keys; existing variants retire by activation flag", () => {
  const form = productForm(product);
  form.variants[0].isActive = false;
  form.variants.push({
    ...newVariant("draft-key"),
    sku: "WINTER-4Y",
    size: "4Y",
    color: structuredClone(product.variants[0].color),
    price: 130,
  });
  const payload = productPayload(form, product);
  assert.deepEqual(payload.variants[0], { _id: product.variants[0]._id, isActive: false });
  assert.equal(payload.variants[1].key, undefined);
  assert.equal(payload.variants[1]._id, undefined);
  assert.equal(payload.variants[1].sku, "WINTER-4Y");
  assert.equal(availableStock({ variants: form.variants }), 0);
});

test("creation strips presentation keys and validates the existing backend contract", () => {
  const form = productForm(product);
  const payload = productPayload(form);
  assert.equal(payload.variants[0]._id, undefined);
  assert.equal(payload.variants[0].key, undefined);
  form.variants[0].stock = -1;
  assert.throws(() => productPayload(form));
  form.variants[0].stock = 1.5;
  assert.throws(() => productPayload(form));
  form.variants[0].stock = 1;
  form.variants.push({ ...form.variants[0], key: "duplicate" });
  assert.throws(() => productPayload(form), /unique/);
});

test("images can be removed and original prices cleared without touching unrelated stock", () => {
  const source = structuredClone(product);
  source.images = [
    {
      url: "https://example.test/image.jpg",
      publicId: "products/image",
      alt: { ar: "صورة", en: "Image" },
    },
  ];
  const form = productForm(source);
  form.images = [];
  form.variants[0].compareAtPrice = null;
  assert.deepEqual(productPayload(form, source), {
    images: [],
    variants: [{ _id: source.variants[0]._id, compareAtPrice: null }],
  });
});

test("price ranges and stock exclude inactive variants", () => {
  const source = structuredClone(product);
  source.variants.push({ ...source.variants[0], isActive: false, price: 300, stock: 100 });
  assert.equal(availableStock(source), 5);
  assert.equal(
    productPrice(source, "en"),
    new Intl.NumberFormat("en", { style: "currency", currency: "ILS" }).format(120),
  );
});

test("API failures map to translated error keys including order-linked deletion", async () => {
  for (const [status, message, expected] of [
    [401, "", "unauthorized"],
    [403, "", "forbidden"],
    [404, "", "notFound"],
    [409, "Product slug already exists", "duplicateSlug"],
    [409, "Cannot delete a product referenced by orders; deactivate it instead", "orders"],
    [409, "Product changed concurrently; reload and retry", "conflict"],
    [400, "Category not found", "category"],
    [400, "Invalid product input", "invalid"],
    [500, "private database details", "server"],
  ]) {
    mock.method(globalThis, "fetch", async () => Response.json({ message }, { status }));
    await assert.rejects(
      () => productRequest("/api/admin/products"),
      (error) => productErrorCode(error) === expected,
    );
    mock.restoreAll();
  }
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(
    () => productRequest("/api/admin/products"),
    (error) => productErrorCode(error) === "network",
  );
});

test("successful requests retain real response envelopes and disable fetch caching", async () => {
  mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/admin/products");
    assert.equal(options.cache, "no-store");
    return Response.json({ product });
  });
  assert.deepEqual(await productRequest("/api/admin/products"), { product });
});

function render(locale, component) {
  const errors = [];
  const html = renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale,
        messages: locale === "ar" ? ar : en,
        timeZone: "Asia/Hebron",
        onError: (error) => errors.push(error),
      },
      component,
    ),
  );
  assert.deepEqual(errors, []);
  return html;
}

test("Arabic and English translations have matching keys", () => {
  assert.deepEqual(Object.keys(ar.Products).sort(), Object.keys(en.Products).sort());
  assert.deepEqual(Object.keys(ar.Products.errors).sort(), Object.keys(en.Products.errors).sort());
});

for (const locale of ["en", "ar"]) {
  test(`${locale}: page renders localized heading, controls, direction and loading state`, () => {
    const html = render(locale, React.createElement(ProductsManager));
    const messages = locale === "ar" ? ar.Products : en.Products;
    assert.ok(html.includes(messages.title));
    assert.ok(html.includes(messages.loading));
    assert.ok(html.includes(`dir="${locale === "ar" ? "rtl" : "ltr"}"`));
    assert.ok(html.includes("dark:bg-[#171717]"));
  });
  test(`${locale}: populated listing renders API data in desktop and mobile layouts`, () => {
    const noop = () => {};
    const html = render(
      locale,
      React.createElement(ProductsTable, {
        data: { products: [product], pagination: { page: 1, limit: 12, total: 13, totalPages: 2 } },
        page: 1,
        loading: false,
        disabled: false,
        filtered: false,
        onPage: noop,
        onRefresh: noop,
        onAdd: noop,
        onReset: noop,
        onDetails: noop,
        onEdit: noop,
        onDelete: noop,
        onToggle: noop,
      }),
    );
    assert.ok(html.includes(product.name[locale]));
    assert.ok(html.includes(product.category.name[locale]));
    assert.ok(html.includes("<table"));
    assert.ok(html.includes("<article"));
    assert.ok(html.includes("lg:hidden"));
    assert.ok(!html.includes(product._id));
  });
  test(`${locale}: editors display saved variant retirement guidance and real image previews`, () => {
    const messages = locale === "ar" ? ar.Products : en.Products;
    const variants = render(
      locale,
      React.createElement(ProductVariantsEditor, {
        variants: productForm(product).variants,
        onChange: () => {},
      }),
    );
    assert.ok(variants.includes(messages.retireHint));
    assert.ok(variants.includes(messages.variantActive));
    const images = render(
      locale,
      React.createElement(ProductImagesManager, {
        images: [
          {
            url: "https://example.test/photo.jpg",
            publicId: "photo",
            alt: { ar: "صورة", en: "Photo" },
          },
        ],
        onChange: () => {},
      }),
    );
    assert.ok(images.includes('src="https://example.test/photo.jpg"'));
    assert.ok(images.includes(messages.removeImage));
  });
}
