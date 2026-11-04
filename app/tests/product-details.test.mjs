import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

// Run actual selection logic and server rendering with the installed React,
// Next Image and next-intl. Only the cart boundary is replaced; no live writes.
const sourceRoot = new URL("../src/", import.meta.url);
const cartUrl = new URL("components/cart/CartProvider.tsx", sourceRoot).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/i18n/navigation")
      return { url: "product-details-test:navigation", shortCircuit: true };
    if (specifier === "next-intl/plugin")
      return { url: "product-details-test:plugin", shortCircuit: true };
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
    if (url === "product-details-test:navigation")
      return {
        format: "commonjs",
        shortCircuit: true,
        source:
          "exports.useRouter = () => ({ push: () => { throw new Error('SSR must not navigate'); } });",
      };
    if (url === "product-details-test:plugin")
      return {
        format: "commonjs",
        shortCircuit: true,
        source: "module.exports = () => config => config;",
      };
    if (url === cartUrl)
      return {
        format: "commonjs",
        shortCircuit: true,
        source: `exports.useCart = () => ({
          busy: false, sessionOnly: false,
          addItem: async () => { throw new Error("SSR must not add items"); },
          openCart: () => { throw new Error("SSR must not open the cart"); }
        });`,
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
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextIntlClientProvider, createTranslator } = require("next-intl");
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const nextConfig = require("../next.config.ts").default;
const ProductDetails = require("../src/components/products/ProductDetails.tsx").default;
const ProductGallery = require("../src/components/products/ProductGallery.tsx").default;
const ProductImage = require("../src/components/home/ProductImage.tsx").default;
const { productReturnPath } = require("../src/lib/auth/product-return.ts");
test("sign-in return accepts only a store path in the current locale", () => {
  assert.equal(productReturnPath("en", "/en/products/rose-set"), "/en/products/rose-set");
  assert.equal(productReturnPath("ar", "/ar/products/rose-set"), "/ar/products/rose-set");
  assert.equal(productReturnPath("en", "/en/cart"), "/en/cart");
  assert.equal(productReturnPath("ar", "/ar/cart"), "/ar/cart");
  assert.equal(productReturnPath("en", "/en/checkout"), "/en/checkout");
  assert.equal(
    productReturnPath("ar", "/ar/checkout/confirmation/507f1f77bcf86cd799439011"),
    "/ar/checkout/confirmation/507f1f77bcf86cd799439011",
  );
  for (const path of [
    "//evil.test",
    "https://evil.test",
    "/ar/products/rose-set",
    "/en/admin",
    "/en/checkout/confirmation/not-an-id",
    "/en/checkout?next=https://evil.test",
    "/en/products/rose-set?next=/admin",
  ]) {
    assert.equal(productReturnPath("en", path), null);
  }
});
const {
  colorKey,
  sizeKey,
  findSelectedVariant,
  quantityForStock,
  galleryImages,
} = require("../src/lib/products/selection.ts");
const messages = Object.fromEntries(
  ["en", "ar"].map((locale) => [
    locale,
    JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")),
  ]),
);

const image = (file, alt = {}) => ({
  url: `https://res.cloudinary.com/test/image/upload/${file}.jpg`,
  alt: { en: "", ar: "", ...alt },
});
const front = image("front", { en: "Outfit from the front", ar: "الطقم من الأمام" });
const back = image("back");
const blue = image("blue");
const variant = (overrides = {}) => ({
  id: "variant-rose-2y",
  sku: "OUTFIT-ROSE-2Y",
  size: "2Y",
  color: { name: { en: "Rose", ar: "وردي" }, hex: "#ddaabb" },
  stock: 3,
  price: 80,
  compareAtPrice: 100,
  images: [front],
  ...overrides,
});
const variants = [
  variant(),
  variant({
    id: "variant-blue-4y",
    sku: "OUTFIT-BLUE-4Y",
    size: "4Y",
    color: { name: { en: "Blue", ar: "أزرق" }, hex: "#aabbdd" },
    price: 95,
    images: [blue, back],
  }),
  variant({ id: "variant-rose-6y", sku: "OUTFIT-ROSE-6Y", size: "6Y", stock: 0, images: [] }),
];
const product = {
  id: "product-1",
  slug: "cotton-outfit",
  name: { en: "Cotton outfit", ar: "طقم قطني" },
  description: { en: "A soft everyday outfit.", ar: "طقم ناعم لكل يوم." },
  category: { id: "category-1", slug: "outfits", name: { en: "Outfits", ar: "أطقم" } },
  images: [front, back],
  variants,
  isNew: true,
};

function render(Component, props, locale = "en") {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      {
        locale,
        messages: messages[locale],
        timeZone: "UTC",
        onError(error) {
          throw error;
        },
      },
      React.createElement(
        ImageConfigContext.Provider,
        { value: { ...imageConfigDefault, ...nextConfig.images } },
        React.createElement(Component, props),
      ),
    ),
  );
}

function buttons(html) {
  return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((match) => ({
    attrs: match[1],
    content: match[2],
  }));
}

function textButton(html, label) {
  const found = buttons(html).find((button) => button.content.includes(label));
  assert.ok(found, `Missing button: ${label}`);
  return found;
}

function labeledButton(html, label) {
  const found = buttons(html).find((button) => button.attrs.includes(`aria-label="${label}"`));
  assert.ok(found, `Missing labeled button: ${label}`);
  return found;
}

test("selection resolves the real SKU using normalized size and color identity", () => {
  const original = variant({
    size: " 2y ",
    color: { ...variants[0].color, name: { en: " ROSE ", ar: "وردي" } },
  });
  assert.equal(sizeKey(original.size), "2y");
  assert.equal(colorKey(original), "rose");
  assert.equal(findSelectedVariant([original], sizeKey("2Y"), colorKey(variants[0])), original);
  assert.equal(findSelectedVariant(variants, "4y", "blue")?.sku, "OUTFIT-BLUE-4Y");

  // Equal swatches or translated names must not collapse distinct variants.
  const otherColor = variant({
    id: "other",
    color: { name: { en: "Blush", ar: "وردي" }, hex: "#ddaabb" },
  });
  assert.notEqual(colorKey(original), colorKey(otherColor));
  assert.equal(findSelectedVariant([original, otherColor], "2y", "blush"), otherColor);
});

test("partial and absent combinations never select a substitute variant", () => {
  for (const [size, color] of [
    ["", ""],
    ["2y", ""],
    ["", "rose"],
    ["2y", "blue"],
    ["4y", "rose"],
    ["9y", "rose"],
  ]) {
    assert.equal(findSelectedVariant(variants, size, color), undefined);
  }
  assert.equal(findSelectedVariant(variants, "6y", "rose")?.stock, 0);
});

test("quantity clamps to available inventory and rejects invalid numeric values", () => {
  assert.equal(quantityForStock(2, 3), 2);
  assert.equal(quantityForStock(10, 3), 3);
  assert.equal(quantityForStock(3, 1), 1, "a lower-stock variant reduces quantity");
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(quantityForStock(value, 3), 1);
  }
  // With no sellable stock the disabled UI retains its inert minimum display.
  assert.equal(quantityForStock(3, 0), 1);
});

test("gallery prioritizes the chosen variant and deduplicates all actual product images", () => {
  const snapshot = structuredClone({ images: product.images, variants });
  assert.deepEqual(
    galleryImages(product.images, variants).map((item) => item.url),
    [front.url, back.url, blue.url],
  );
  assert.deepEqual(
    galleryImages(product.images, variants, variants[1]).map((item) => item.url),
    [blue.url, back.url, front.url],
  );
  assert.deepEqual(galleryImages([], []), []);
  assert.deepEqual(
    { images: product.images, variants },
    snapshot,
    "selection must not mutate product data",
  );
});

for (const locale of ["en", "ar"]) {
  test(`${locale}: product details render localized data and keep purchase actions disabled until selection`, () => {
    const copy = messages[locale].ProductDetails;
    const html = render(ProductDetails, { product }, locale);
    for (const text of [
      product.name[locale],
      product.description[locale],
      product.category.name[locale],
      copy.size,
      copy.color,
      copy.quantity,
      copy.chooseSizeFirst,
      copy.selectOptions,
      copy.buyNowCartHint,
      copy.cashOnDelivery,
    ]) {
      assert.ok(html.includes(text), `Expected localized content: ${text}`);
    }
    assert.ok(html.includes("₪"));
    assert.match(textButton(html, copy.addToCart).attrs, /\bdisabled=""/);
    assert.match(textButton(html, copy.buyNow).attrs, /\bdisabled=""/);
    assert.match(labeledButton(html, copy.increaseQuantity).attrs, /\bdisabled=""/);
    assert.match(labeledButton(html, copy.decreaseQuantity).attrs, /\bdisabled=""/);
    assert.match(textButton(html, "6Y").attrs, /\bdisabled=""/);
    assert.doesNotMatch(textButton(html, "2Y").attrs, /\bdisabled=""/);
    for (const color of [variants[0].color.name[locale], variants[1].color.name[locale]]) {
      assert.match(textButton(html, color).attrs, /\bdisabled=""/);
    }
  });

  test(`${locale}: unavailable products show a truthful fallback with no enabled purchase actions`, () => {
    const copy = messages[locale].ProductDetails;
    const unavailable = { ...product, images: [], variants: [], description: { en: "", ar: "" } };
    const html = render(ProductDetails, { product: unavailable }, locale);
    for (const text of [
      copy.outOfStock,
      copy.noVariants,
      copy.priceUnavailable,
      copy.imagePlaceholder,
    ]) {
      assert.ok(html.includes(text));
    }
    assert.match(textButton(html, copy.addToCart).attrs, /\bdisabled=""/);
    assert.match(textButton(html, copy.buyNow).attrs, /\bdisabled=""/);
    assert.doesNotMatch(html, /<img\b/);
  });

  test(`${locale}: gallery renders every thumbnail, accessible controls and optimized Cloudinary images`, () => {
    const t = createTranslator({ locale, messages: messages[locale], namespace: "ProductDetails" });
    const html = render(
      ProductGallery,
      { images: [front, back, blue], name: product.name[locale] },
      locale,
    );
    assert.ok(html.includes(`aria-label="${t("galleryLabel", { name: product.name[locale] })}"`));
    assert.ok(html.includes(front.alt[locale]));
    assert.equal((html.match(/<img\b/g) ?? []).length, 4, "one main image plus three thumbnails");
    for (let number = 1; number <= 3; number++) {
      const button = labeledButton(html, t("viewImage", { number }));
      assert.ok(button.attrs.includes(`aria-pressed="${number === 1}"`));
    }
    assert.match(labeledButton(html, t("previousImage")).attrs, /\bdisabled=""/);
    assert.doesNotMatch(labeledButton(html, t("nextImage")).attrs, /\bdisabled=""/);
    assert.ok(html.includes(t("imageCounter", { current: 1, total: 3 })));
    assert.match(html, /src="\/_next\/image\?url=https%3A%2F%2Fres\.cloudinary\.com/);
    assert.match(html, /srcSet=/);
    assert.ok(html.includes(t("imageAlt", { name: product.name[locale], number: 2 })));
  });
}

test("malformed and unsafe image URLs render fallback instead of throwing or requesting them", () => {
  for (const src of [
    null,
    "not a url",
    "http://example.test/image.jpg",
    "https://user:secret@example.test/image.jpg",
  ]) {
    const html = render(ProductImage, { src, alt: "Outfit", placeholder: "Image unavailable" });
    assert.match(html, /role="img"/);
    assert.ok(html.includes("Image unavailable"));
    assert.doesNotMatch(html, /<img\b|user:secret/);
  }
});
