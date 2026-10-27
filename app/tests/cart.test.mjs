import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, test } from "node:test";
import ts from "typescript";

const sourceRoot = new URL("../src/", import.meta.url);
const storefrontUrl = new URL("lib/products/storefront.ts", sourceRoot).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return { url: new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith(sourceRoot.href)) {
      return { url: new URL(`${specifier}.ts`, context.parentURL).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === storefrontUrl) {
      return {
        format: "commonjs",
        shortCircuit: true,
        source: "exports.getStorefrontProduct = (slug) => globalThis.cartTestCatalog(slug);",
      };
    }
    if (url.startsWith(sourceRoot.href) && url.endsWith(".ts")) {
      return {
        format: "commonjs",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});

const require = createRequire(import.meta.url);
const { validateCartItem, refreshCart } = require("../src/lib/cart/actions.ts");
const {
  parseStoredCart,
  cartReferences,
  requestedCartQuantity,
  MAX_CART_LINES,
} = require("../src/lib/cart/state.ts");
const variantId = "507f1f77bcf86cd799439013";
const otherVariantId = "507f1f77bcf86cd799439014";
const reference = { slug: "cotton-set", variantId, quantity: 2 };
const product = {
  id: "507f1f77bcf86cd799439011",
  slug: "cotton-set",
  name: { ar: "طقم قطني", en: "Cotton set" },
  images: [{ url: "https://res.cloudinary.com/test/product.jpg", alt: { ar: "", en: "" } }],
  variants: [
    {
      id: variantId,
      sku: "COTTON-2Y-PINK",
      size: "2Y",
      color: { name: { ar: "وردي", en: "Pink" }, hex: "#ffbbcc" },
      stock: 4,
      price: 95.5,
      images: [{ url: "https://res.cloudinary.com/test/pink.jpg" }],
    },
    {
      id: otherVariantId,
      sku: "COTTON-4Y-PINK",
      size: "4Y",
      color: { name: { ar: "وردي", en: "Pink" }, hex: "#ffbbcc" },
      stock: 0,
      price: 100,
      images: [],
    },
  ],
};

globalThis.cartTestCatalog = async () => structuredClone(product);
afterEach(() => {
  globalThis.cartTestCatalog = async () => structuredClone(product);
});

test("cart actions reject invalid and tampered input before catalog access", async () => {
  globalThis.cartTestCatalog = () => {
    throw new Error("must not query");
  };
  for (const input of [
    null,
    { ...reference, price: 0.01 },
    { ...reference, quantity: 0 },
    { ...reference, quantity: 1.5 },
    { ...reference, quantity: Number.MAX_SAFE_INTEGER + 1 },
    { ...reference, slug: "../admin" },
    { ...reference, variantId: "malformed" },
  ]) {
    assert.deepEqual(await validateCartItem(input), { ok: false, error: "invalid" });
  }
});

test("adding derives authoritative price, SKU, identity and variant image", async () => {
  const result = await validateCartItem(reference);
  assert.equal(result.ok, true);
  assert.equal(result.item.price, 95.5);
  assert.equal(result.item.sku, "COTTON-2Y-PINK");
  assert.equal(result.item.variantId, variantId);
  assert.equal(result.item.productId, product.id);
  assert.equal(result.item.image, product.variants[0].images[0].url);
  assert.equal(result.item.quantity, 2);
  assert.equal(result.item.stock, 4);
});

test("stock validation counts quantities already in the bag", async () => {
  const quantity = requestedCartQuantity([{ ...reference, quantity: 3 }], reference);
  assert.equal(quantity, 5);
  assert.deepEqual(await validateCartItem({ ...reference, quantity }), {
    ok: false,
    error: "stock",
  });
  assert.equal((await validateCartItem({ ...reference, quantity: 4 })).ok, true);
  assert.deepEqual(
    await validateCartItem({ ...reference, variantId: otherVariantId, quantity: 1 }),
    { ok: false, error: "stock" },
  );
});

test("missing products and removed or inactive variants cannot enter the cart", async () => {
  globalThis.cartTestCatalog = async () => null;
  assert.deepEqual(await validateCartItem(reference), { ok: false, error: "unavailable" });
  globalThis.cartTestCatalog = async () => ({ ...product, variants: [] });
  assert.deepEqual(await validateCartItem(reference), { ok: false, error: "unavailable" });
});

test("restoring clamps stock, removes unavailable lines and refreshes prices", async () => {
  let calls = 0;
  globalThis.cartTestCatalog = async () => {
    calls++;
    const current = structuredClone(product);
    current.variants[0].price = 110;
    current.variants[0].stock = 1;
    return current;
  };
  const result = await refreshCart([reference, { ...reference, variantId: otherVariantId }]);
  assert.equal(result.ok, true);
  assert.equal(result.adjusted, true);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].quantity, 1);
  assert.equal(result.items[0].price, 110);
  assert.equal(calls, 1, "variants of a single product share one catalog read");
});

test("restoration is bounded and does not accept duplicate lines", async () => {
  assert.deepEqual(await refreshCart([reference, reference]), { ok: false, error: "invalid" });
  assert.deepEqual(await refreshCart(Array(MAX_CART_LINES + 1).fill(reference)), {
    ok: false,
    error: "invalid",
  });
  assert.deepEqual(await refreshCart([]), { ok: true, items: [], adjusted: false });
});

test("storage contains only validated references and combines duplicate quantities safely", () => {
  const saved = cartReferences([{ ...reference, price: 1, sku: "tampered", name: "tampered" }]);
  assert.deepEqual(saved, [reference]);
  assert.deepEqual(parseStoredCart(JSON.stringify(saved)), [reference]);
  assert.deepEqual(parseStoredCart(JSON.stringify([reference, reference])), [
    { ...reference, quantity: 4 },
  ]);
  assert.deepEqual(parseStoredCart(JSON.stringify([{ ...reference, price: 1 }])), []);
  assert.deepEqual(parseStoredCart(JSON.stringify([{ ...reference, quantity: -2 }])), []);
  assert.deepEqual(parseStoredCart("broken JSON"), []);
  assert.deepEqual(parseStoredCart(null), []);
});

test("database failures report failure instead of returning a successful empty cart", async () => {
  globalThis.cartTestCatalog = async () => {
    throw new Error("database unavailable");
  };
  assert.deepEqual(await validateCartItem(reference), { ok: false, error: "server" });
  assert.deepEqual(await refreshCart([reference]), { ok: false, error: "server" });
});
