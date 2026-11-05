import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, mock, test } from "node:test";
import mongoose from "mongoose";

const sourceRoot = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "test:server-only", shortCircuit: true };
    if (specifier.startsWith("@/"))
      return { url: new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, shortCircuit: true };
    if (specifier.startsWith(".") && context.parentURL?.startsWith(sourceRoot.href))
      return nextResolve(specifier.endsWith(".ts") ? specifier : `${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "test:server-only")
      return { format: "module", source: "export {};", shortCircuit: true };
    return nextLoad(url, context);
  },
});

const { checkoutSchema, idempotencyKeySchema, shippingFeeFor, priceInCents } =
  await import("../src/lib/checkout/validation.ts");
const { checkout } = await import("../src/lib/checkout/server.ts");
const { Cart } = await import("../src/models/Cart.ts");
const { Product } = await import("../src/models/Product.ts");
const { Order } = await import("../src/models/Order.ts");

const owner = new mongoose.Types.ObjectId("507f1f77bcf86cd799439010");
const productId = "507f1f77bcf86cd799439011";
const variantId = "507f1f77bcf86cd799439012";
const key = "4ad8b155-17bf-4e3b-b132-cc6a194c81d2";
const input = {
  customerName: " Test Customer ",
  phone: "+970 599 123456",
  region: "west_bank",
  city: "Ramallah",
  address: "Main Street 12",
  notes: "",
  cartRevision: 0,
};
const parsedInput = checkoutSchema.parse(input);

function query(value) {
  return {
    select() {
      return this;
    },
    session() {
      return this;
    },
    lean: async () => value,
  };
}

function fakeDatabase({
  stock = 5,
  failOrder = false,
  failClear = false,
  failStockUpdate = false,
  transactionUnavailable = false,
} = {}) {
  let state = {
    cart: {
      _id: "507f1f77bcf86cd799439013",
      owner: owner.toString(),
      revision: 0,
      items: [{ product: productId, variantId, quantity: 2 }],
    },
    product: {
      _id: productId,
      isActive: true,
      name: { ar: "طقم قطني", en: "Cotton set" },
      images: [],
      variants: [
        {
          _id: variantId,
          isActive: true,
          stock,
          price: 95.5,
          sku: "COTTON-PINK",
          size: "2Y",
          color: { name: { ar: "وردي", en: "Pink" } },
          images: [],
        },
      ],
    },
    orders: [],
  };
  mock.method(Order, "init", async () => Order);
  mock.method(Order, "findOne", (filter) =>
    query(
      state.orders.find(
        (order) =>
          String(order.user) === String(filter.user) &&
          order.idempotencyKeyHash === filter.idempotencyKeyHash,
      ) ?? null,
    ),
  );
  mock.method(Cart, "findOne", () => query(state.cart));
  mock.method(Product, "find", () => query([state.product]));
  mock.method(Product, "updateOne", async (filter, update) => {
    if (failStockUpdate) return { modifiedCount: 0 };
    const selected = state.product.variants.find(
      (variant) => variant._id === String(filter.variants.$elemMatch._id),
    );
    if (
      !state.product.isActive ||
      !selected?.isActive ||
      selected.stock < filter.variants.$elemMatch.stock.$gte
    )
      return { modifiedCount: 0 };
    selected.stock += update.$inc["variants.$.stock"];
    return { modifiedCount: 1 };
  });
  mock.method(Order, "create", async ([document]) => {
    if (failOrder) throw new Error("simulated insert failure");
    state.orders.push(document);
    return [document];
  });
  mock.method(Cart, "updateOne", async (filter, update) => {
    if (failClear || state.cart.revision !== filter.revision) return { modifiedCount: 0 };
    state.cart.items = update.$set.items;
    state.cart.revision += update.$inc.revision;
    return { modifiedCount: 1 };
  });
  mock.method(mongoose, "startSession", async () => ({
    withTransaction: async (callback) => {
      if (transactionUnavailable) throw new Error("Transactions are unavailable");
      const before = structuredClone(state);
      try {
        return await callback();
      } catch (error) {
        state = before;
        throw error;
      }
    },
    endSession: async () => {},
  }));
  return {
    get state() {
      return state;
    },
  };
}

afterEach(() => mock.restoreAll());

test("checkout input accepts only delivery details and stable regions", () => {
  assert.equal(parsedInput.customerName, "Test Customer");
  assert.deepEqual(
    [shippingFeeFor("west_bank"), shippingFeeFor("jerusalem"), shippingFeeFor("inside_48")],
    [20, 30, 70],
  );
  assert.equal(priceInCents(95.5), 9550);
  assert.equal(priceInCents(95.555), null);
  assert.equal(idempotencyKeySchema.safeParse(key).success, true);
  for (const invalid of [
    { ...input, region: "other" },
    { ...input, phone: "hello" },
    { ...input, address: " " },
    { ...input, shippingFee: 0 },
    { ...input, userId: owner.toString() },
  ])
    assert.equal(checkoutSchema.safeParse(invalid).success, false);
});

test("checkout snapshots current prices, deducts stock, and clears the cart atomically", async () => {
  const db = fakeDatabase();
  const result = await checkout(owner, parsedInput, key);
  assert.equal(result.replayed, false);
  assert.match(result.orderNumber, /^AN-\d{8}-[A-F0-9]{24}$/);
  assert.equal(db.state.product.variants[0].stock, 3);
  assert.deepEqual(db.state.cart.items, []);
  const order = db.state.orders[0];
  await new Order(order).validate();
  assert.equal(order.items[0].unitPrice, 95.5);
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.items[0].name.ar, "طقم قطني");
  assert.equal(order.subtotal, 191);
  assert.equal(order.shippingFee, 20);
  assert.equal(order.total, 211);
  assert.equal(order.paymentMethod, "cash_on_delivery");
  assert.equal(order.paymentStatus, "unpaid");
  assert.equal(order.shippingRegion, "west_bank");
});

test("checkout rejects a cart revision that was not reviewed", async () => {
  const db = fakeDatabase();
  await assert.rejects(checkout(owner, { ...parsedInput, cartRevision: 1 }, key), { status: 409 });
  assert.equal(db.state.product.variants[0].stock, 5);
  assert.equal(db.state.orders.length, 0);
  assert.equal(db.state.cart.items.length, 1);
});

test("insufficient stock rejects checkout without an order or cart change", async () => {
  const db = fakeDatabase({ stock: 1 });
  await assert.rejects(checkout(owner, parsedInput, key), { status: 409 });
  assert.equal(db.state.product.variants[0].stock, 1);
  assert.equal(db.state.orders.length, 0);
  assert.equal(db.state.cart.items.length, 1);
});

test("a failed conditional stock update cannot create an order", async () => {
  const db = fakeDatabase({ failStockUpdate: true });
  await assert.rejects(checkout(owner, parsedInput, key), { status: 409 });
  assert.equal(db.state.product.variants[0].stock, 5);
  assert.equal(db.state.orders.length, 0);
  assert.equal(db.state.cart.items.length, 1);
});

test("unavailable transactions fail closed without any checkout writes", async () => {
  const db = fakeDatabase({ transactionUnavailable: true });
  await assert.rejects(checkout(owner, parsedInput, key), { status: 503 });
  assert.equal(db.state.product.variants[0].stock, 5);
  assert.equal(db.state.orders.length, 0);
  assert.equal(db.state.cart.items.length, 1);
});

test("order insert and cart clearing failures roll back stock deduction", async () => {
  for (const options of [{ failOrder: true }, { failClear: true }]) {
    const db = fakeDatabase(options);
    await assert.rejects(checkout(owner, parsedInput, key));
    assert.equal(db.state.product.variants[0].stock, 5);
    assert.equal(db.state.orders.length, 0);
    assert.equal(db.state.cart.items.length, 1);
    mock.restoreAll();
  }
});

test("same key replays one order; another key cannot submit the cleared cart", async () => {
  const db = fakeDatabase();
  const first = await checkout(owner, parsedInput, key);
  const retry = await checkout(owner, parsedInput, key);
  assert.deepEqual(retry, { ...first, replayed: true });
  assert.equal(db.state.orders.length, 1);
  assert.equal(db.state.product.variants[0].stock, 3);
  await assert.rejects(checkout(owner, { ...parsedInput, city: "Other" }, key), { status: 409 });
  await assert.rejects(checkout(owner, parsedInput, "40beca2a-ef53-4d0a-9a0a-c5e8727d243e"), {
    status: 409,
  });
  assert.equal(db.state.orders.length, 1);
});
