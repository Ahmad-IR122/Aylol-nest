import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, mock, test } from "node:test";

// Node 22.18+ strips TypeScript. Resolve the app alias and replace only the
// Clerk boundary; use the real route handlers, validators and Mongoose models.
const sourceRoot = new URL("../src/", import.meta.url);
const authUrl = new URL("lib/auth/require-admin.ts", sourceRoot).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return { url: new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, shortCircuit: true };
    }
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(sourceRoot.href) &&
      !specifier.endsWith(".ts")
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === authUrl) {
      return {
        format: "module",
        shortCircuit: true,
        source: `export class UnauthorizedError extends Error {}
          export class ForbiddenError extends Error {}
          let failure;
          export function setFailure(error) { failure = error; }
          export async function requireAdmin() { if (failure) throw failure; }`,
      };
    }
    return nextLoad(url, context);
  },
});

const { NextRequest } = await import("next/server.js");
const collection = await import("../src/app/api/admin/products/route.ts");
const single = await import("../src/app/api/admin/products/[id]/route.ts");
const auth = await import(authUrl);
const { Product } = await import("../src/models/Product.ts");
const { Category } = await import("../src/models/Category.ts");
const { Order } = await import("../src/models/Order.ts");
const { createProductSchema, updateProductSchema, parseProductQuery } =
  await import("../src/lib/products/validation.ts");

const id = "507f1f77bcf86cd799439011";
const category = "507f1f77bcf86cd799439012";
const variantId = "507f1f77bcf86cd799439013";
const secondVariantId = "507f1f77bcf86cd799439014";
const variant = {
  sku: "WINTER-2Y-BEIGE",
  size: "2Y",
  color: { name: { ar: "بيج", en: "Beige" }, hex: "#eeddbb" },
  stock: 5,
  price: 120,
};
const body = {
  name: { ar: "طقم أطفال", en: "Kids Set" },
  slug: "kids-set",
  category,
  gender: "unisex",
  ageGroup: "toddler",
  variants: [variant],
};
const context = { params: Promise.resolve({ id }) };
const request = (method, value, query = "") =>
  new NextRequest(`https://example.test/api/admin/products${query}`, {
    method,
    ...(value === undefined
      ? {}
      : { body: JSON.stringify(value), headers: { "content-type": "application/json" } }),
  });
const queryResult = (value) => ({
  populate() {
    return this;
  },
  lean: async () => value,
});
const existingProduct = () =>
  Product.hydrate({
    ...structuredClone(body),
    _id: id,
    __v: 3,
    variants: [
      { ...structuredClone(variant), _id: variantId },
      { ...structuredClone(variant), _id: secondVariantId, sku: "WINTER-4Y-BEIGE", size: "4Y" },
    ],
  });

afterEach(() => {
  mock.restoreAll();
  auth.setFailure(undefined);
});

test("every handler rejects unauthenticated and non-admin callers before database access", async () => {
  const database = mock.method(Product, "findById", () => {
    throw new Error("Database must not be called");
  });
  for (const [error, status] of [
    [new auth.UnauthorizedError("Authentication required"), 401],
    [new auth.ForbiddenError("Admin access required"), 403],
  ]) {
    auth.setFailure(error);
    for (const [handler, method] of [
      [collection.GET, "GET"],
      [collection.POST, "POST"],
      [single.GET, "GET"],
      [single.PATCH, "PATCH"],
      [single.DELETE, "DELETE"],
    ]) {
      assert.equal((await handler(request(method), context)).status, status);
    }
  }
  assert.equal(database.mock.callCount(), 0);
});

test("validation rejects unsafe types, fields, image URLs, stock, and query inputs", () => {
  assert.equal(createProductSchema.parse(body).variants[0].price, 120);
  for (const changes of [
    { name: { ar: " ", en: "Kids" } },
    { slug: "bad/slug" },
    { category: "bad" },
    { isActive: "false" },
    { role: "admin" },
    { price: 2 },
    { variants: [] },
    { variants: [{ ...variant, stock: -1 }] },
    { variants: [{ ...variant, stock: 0.5 }] },
    { variants: [{ ...variant, price: "120" }] },
    { variants: [{ ...variant, price: Infinity }] },
    { images: [{ url: "javascript:alert(1)", publicId: "x" }] },
    { images: [{ url: "https://example.test/a.jpg" }] },
    { name: { ...body.name, $set: {} } },
  ])
    assert.equal(createProductSchema.safeParse({ ...body, ...changes }).success, false);
  for (const value of [
    null,
    [],
    {},
    { $set: { isActive: true } },
    { variants: [{ _id: variantId, stock: "2" }] },
  ]) {
    assert.equal(updateProductSchema.safeParse(value).success, false);
  }
  for (const value of [
    "page=0",
    "page=1.5",
    "limit=101",
    "page=1&page=2",
    "isActive=no",
    "category[$ne]=x",
    "sortBy=__proto__",
    "search=" + "a".repeat(201),
  ]) {
    assert.throws(() => parseProductQuery(new URLSearchParams(value)));
  }
});

test("POST uses model defaults and returns 201; malformed JSON is 400", async () => {
  mock.method(Category, "exists", async () => ({ _id: category }));
  mock.method(Product, "exists", async () => null);
  mock.method(Product, "create", async (input) => {
    const document = new Product(input);
    await document.validate();
    document.populate = async () => document;
    return document;
  });
  const response = await collection.POST(request("POST", body));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.product.isActive, true);
  assert.equal(result.product.variants[0].stock, 5);
  assert.ok(result.product.variants[0]._id);
  const malformed = new NextRequest("https://example.test/api/admin/products", {
    method: "POST",
    body: "{",
  });
  assert.equal((await collection.POST(malformed)).status, 400);
});

test("POST rejects missing categories, duplicate slugs including races, and duplicate variants", async () => {
  const categoryLookup = mock.method(Category, "exists", async () => null);
  assert.equal((await collection.POST(request("POST", body))).status, 400);
  categoryLookup.mock.mockImplementation(async () => ({ _id: category }));
  const slugLookup = mock.method(Product, "exists", async () => ({ _id: id }));
  assert.equal((await collection.POST(request("POST", body))).status, 409);
  slugLookup.mock.mockImplementation(async () => null);
  mock.method(Product, "create", async () => {
    throw { code: 11000 };
  });
  assert.equal((await collection.POST(request("POST", body))).status, 409);
  assert.equal(
    (await collection.POST(request("POST", { ...body, variants: [variant, variant] }))).status,
    400,
  );
});

test("GET applies escaped bilingual search, filters, bounded pagination, stable sorting, and category population", async () => {
  const calls = {};
  const chain = { ...queryResult([]) };
  for (const method of ["sort", "skip", "limit", "populate"])
    chain[method] = (value) => {
      calls[method] = value;
      return chain;
    };
  mock.method(Product, "find", (filter) => {
    calls.filter = filter;
    return chain;
  });
  mock.method(Product, "countDocuments", async (filter) => {
    assert.deepEqual(filter, calls.filter);
    return 21;
  });
  const response = await collection.GET(
    request(
      "GET",
      undefined,
      `?search=%5Bkids%5D.*&category=${category}&isActive=false&page=2&limit=20&sortBy=name.en&sortOrder=asc`,
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(calls.filter.$or[0]["name.ar"].$regex, "\\[kids\\]\\.\\*");
  assert.equal(calls.filter.isActive, false);
  assert.equal(String(calls.filter.category), category);
  assert.deepEqual(calls.sort, { "name.en": 1, _id: 1 });
  assert.equal(calls.skip, 20);
  assert.equal(calls.limit, 20);
  assert.equal(calls.populate.model, Category);
  assert.deepEqual((await response.json()).pagination, {
    page: 2,
    limit: 20,
    total: 21,
    totalPages: 2,
  });
});

test("single GET distinguishes invalid IDs, missing products, and successful lookup", async () => {
  assert.equal(
    (await single.GET(request("GET"), { params: Promise.resolve({ id: "bad" }) })).status,
    400,
  );
  const lookup = mock.method(Product, "findById", () => queryResult(null));
  assert.equal((await single.GET(request("GET"), context)).status, 404);
  lookup.mock.mockImplementation(() => queryResult({ _id: id }));
  assert.equal((await single.GET(request("GET"), context)).status, 200);
});

test("PATCH preserves omitted languages, variant IDs and inventory, and uses a version predicate", async () => {
  const document = existingProduct();
  mock.method(Product, "findById", async () => document);
  let update;
  mock.method(Product, "findOneAndUpdate", (filter, changes) => {
    assert.deepEqual(filter, { _id: id, __v: 3 });
    update = changes;
    return queryResult(document.toObject());
  });
  const response = await single.PATCH(
    request("PATCH", {
      name: { en: "Updated" },
      isActive: false,
      variants: [{ _id: variantId, stock: 2, color: { name: { en: "Sand" } } }],
    }),
    context,
  );
  assert.equal(response.status, 200);
  const result = (await response.json()).product;
  assert.equal(result.name.ar, body.name.ar);
  assert.equal(result.variants[0]._id, variantId);
  assert.equal(result.variants[0].stock, 2);
  assert.equal(result.variants[0].color.name.ar, variant.color.name.ar);
  assert.equal(result.variants[1]._id, secondVariantId);
  assert.equal(result.variants[1].stock, 5);
  assert.equal(update.$set["variants.0.stock"], 2);
  assert.equal(update.$set["name.ar"], undefined);
  assert.deepEqual(update.$inc, { __v: 1 });
});

test("PATCH appends complete variants while keeping existing identities", async () => {
  const document = existingProduct();
  mock.method(Product, "findById", async () => document);
  mock.method(Product, "findOneAndUpdate", () => queryResult(document.toObject()));
  const response = await single.PATCH(
    request("PATCH", { variants: [{ ...variant, sku: "WINTER-6Y-BEIGE", size: "6Y" }] }),
    context,
  );
  assert.equal(response.status, 200);
  const result = (await response.json()).product;
  assert.equal(result.variants.length, 3);
  assert.equal(result.variants[0]._id, variantId);
  assert.ok(result.variants[2]._id);
});

test("PATCH rejects unknown or repeated variant IDs, invalid categories, and conflicting identities", async () => {
  mock.method(Product, "findById", async () => existingProduct());
  mock.method(Category, "exists", async () => null);
  for (const value of [
    { category },
    { variants: [{ _id: id, stock: 1 }] },
    {
      variants: [
        { _id: variantId, stock: 1 },
        { _id: variantId, stock: 2 },
      ],
    },
    { variants: [{ _id: secondVariantId, sku: variant.sku }] },
  ])
    assert.equal((await single.PATCH(request("PATCH", value), context)).status, 400);
});

test("PATCH reports concurrent writes as 409 and concurrent deletion as 404", async () => {
  mock.method(Product, "findById", async () => existingProduct());
  mock.method(Product, "findOneAndUpdate", () => queryResult(null));
  const lookup = mock.method(Product, "exists", async () => ({ _id: id }));
  assert.equal((await single.PATCH(request("PATCH", { isActive: false }), context)).status, 409);
  lookup.mock.mockImplementation(async () => null);
  assert.equal((await single.PATCH(request("PATCH", { isActive: false }), context)).status, 404);
});

test("DELETE blocks order references and deletes only unreferenced products", async () => {
  const exists = mock.method(Product, "exists", async () => ({ _id: id }));
  const orders = mock.method(Order, "exists", async (filter) => {
    assert.deepEqual(filter, { "items.product": id });
    return { _id: id };
  });
  const remove = mock.method(Product, "deleteOne", async () => ({ deletedCount: 1 }));
  assert.equal((await single.DELETE(request("DELETE"), context)).status, 409);
  assert.equal(remove.mock.callCount(), 0);
  orders.mock.mockImplementation(async () => null);
  assert.equal((await single.DELETE(request("DELETE"), context)).status, 200);
  assert.equal(remove.mock.callCount(), 1);
  exists.mock.mockImplementation(async () => null);
  assert.equal((await single.DELETE(request("DELETE"), context)).status, 404);
});

test("unexpected database failures return a generic 500", async () => {
  mock.method(Product, "exists", async () => {
    throw new Error("private database details");
  });
  mock.method(console, "error", () => {});
  const response = await single.DELETE(request("DELETE"), context);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: "Internal server error" });
});
