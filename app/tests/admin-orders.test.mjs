import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, mock, test } from "node:test";
import mongoose from "mongoose";

const root = new URL("../src/", import.meta.url);
const authUrl = new URL("lib/auth/require-admin.ts", root).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "test:server-only", shortCircuit: true };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith("@/"))
      return { url: new URL(`${specifier.slice(2)}.ts`, root).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "test:server-only")
      return { format: "module", source: "export {};", shortCircuit: true };
    if (url === authUrl)
      return {
        format: "module",
        shortCircuit: true,
        source: `export class UnauthorizedError extends Error {}
          export class ForbiddenError extends Error {}
          let failure;
          export function setFailure(error) { failure = error; }
          export async function requireAdmin() { if (failure) throw failure; }`,
      };
    return nextLoad(url, context);
  },
});

const { NextRequest } = await import("next/server.js");
const collection = await import("../src/app/api/admin/orders/route.ts");
const single = await import("../src/app/api/admin/orders/[id]/route.ts");
const auth = await import(authUrl);
const { Order } = await import("../src/models/Order.ts");
const { Product } = await import("../src/models/Product.ts");
const { changeOrderStatus, parseOrderQuery, statusUpdateSchema } =
  await import("../src/lib/orders/server.ts");
const { canTransitionOrder } = await import("../src/lib/orders/status.ts");

const orderId = "507f1f77bcf86cd799439011";
const productId = "507f1f77bcf86cd799439012";
const firstVariant = "507f1f77bcf86cd799439013";
const secondVariant = "507f1f77bcf86cd799439014";
const context = { params: Promise.resolve({ id: orderId }) };

afterEach(() => {
  mock.restoreAll();
  auth.setFailure(undefined);
});

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

function fakeTransaction({
  status = "pending",
  secondLine = false,
  failSecond = false,
  paymentStatus = "unpaid",
} = {}) {
  let state = {
    order: {
      _id: orderId,
      status,
      paymentStatus,
      items: [
        { product: productId, variantId: firstVariant, quantity: 2 },
        ...(secondLine ? [{ product: productId, variantId: secondVariant, quantity: 1 }] : []),
      ],
    },
    stock: { [firstVariant]: 3, [secondVariant]: 4 },
    stockUpdates: 0,
  };
  mock.method(Order, "findById", () => query(state.order));
  mock.method(Product, "updateOne", async (filter, update) => {
    const variant = String(filter.variants.$elemMatch._id);
    if (failSecond && variant === secondVariant) return { modifiedCount: 0 };
    state.stock[variant] += update.$inc["variants.$.stock"];
    state.stockUpdates++;
    return { modifiedCount: 1 };
  });
  mock.method(Order, "findOneAndUpdate", (filter, update) => {
    if (state.order.status !== filter.status) return query(null);
    Object.assign(state.order, update.$set);
    return query(state.order);
  });
  mock.method(mongoose, "startSession", async () => ({
    withTransaction: async (callback) => {
      const previous = structuredClone(state);
      try {
        return await callback();
      } catch (error) {
        state = previous;
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

test("every orders endpoint checks Mongo-backed admin authorization first", async () => {
  mock.method(Order, "find", () => {
    throw new Error("must not query orders");
  });
  mock.method(Order, "findById", () => {
    throw new Error("must not query order");
  });
  auth.setFailure(new auth.UnauthorizedError("Authentication required"));
  const list = await collection.GET(new NextRequest("https://store.test/api/admin/orders"));
  assert.equal(list.status, 401);
  auth.setFailure(new auth.ForbiddenError("Admin access required"));
  const detail = await single.GET(new Request("https://store.test/api/admin/orders/bad"), context);
  assert.equal(detail.status, 403);
  const patch = await single.PATCH(
    new Request("https://store.test/api/admin/orders/bad", { method: "PATCH", body: "{}" }),
    context,
  );
  assert.equal(patch.status, 403);
});

test("cross-origin status updates are rejected before reading an order", async () => {
  mock.method(Order, "findById", () => {
    throw new Error("must not query order");
  });
  const response = await single.PATCH(
    new Request("https://store.test/api/admin/orders/bad", {
      method: "PATCH",
      headers: { origin: "https://other.test", "content-type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }),
    context,
  );
  assert.equal(response.status, 403);
});

test("query and PATCH validation reject unsafe filters and fields", () => {
  assert.deepEqual(parseOrderQuery(new URLSearchParams("page=2&status=shipped")), {
    search: "",
    status: "shipped",
    page: 2,
    limit: 12,
  });
  for (const queryString of [
    "page=0",
    "limit=100",
    "status=unknown",
    "page=1&page=2",
    "sortBy=total",
  ])
    assert.throws(() => parseOrderQuery(new URLSearchParams(queryString)));
  assert.equal(statusUpdateSchema.safeParse({ status: "confirmed" }).success, true);
  assert.equal(statusUpdateSchema.safeParse({ status: "cancelled", total: 0 }).success, false);
  assert.equal(canTransitionOrder("shipped", "cancelled"), false);
  assert.equal(canTransitionOrder("delivered", "cancelled"), false);
});

test("orders list searches safely, filters status, and sorts newest first", async () => {
  const queryInfo = {};
  mock.method(Order, "find", (filter) => {
    queryInfo.filter = filter;
    return {
      select(fields) {
        queryInfo.fields = fields;
        return this;
      },
      sort(value) {
        queryInfo.sort = value;
        return this;
      },
      skip(value) {
        queryInfo.skip = value;
        return this;
      },
      limit(value) {
        queryInfo.limit = value;
        return this;
      },
      async lean() {
        return [{ _id: orderId, orderNumber: "AN-20261104-123" }];
      },
    };
  });
  mock.method(Order, "countDocuments", async () => 13);
  const response = await collection.GET(
    new NextRequest(
      "https://store.test/api/admin/orders?search=%5Bkid%5D.*&status=confirmed&page=2&limit=12",
    ),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.orders.length, 1);
  assert.deepEqual(data.pagination, { page: 2, limit: 12, total: 13, totalPages: 2 });
  assert.equal(queryInfo.filter.status, "confirmed");
  assert.equal(queryInfo.filter.$or[0].orderNumber.$regex, "\\[kid\\]\\.\\*");
  assert.deepEqual(queryInfo.sort, { createdAt: -1, _id: -1 });
  assert.equal(queryInfo.skip, 12);
  assert.equal(queryInfo.limit, 12);
  assert.ok(!queryInfo.fields.includes("idempotencyKeyHash"));
});

test("cancellation restores each variant once and repeat requests are harmless", async () => {
  const db = fakeTransaction();
  const first = await changeOrderStatus(orderId, "cancelled");
  assert.equal(first.status, "cancelled");
  assert.equal(db.state.stock[firstVariant], 5);
  assert.equal(db.state.stockUpdates, 1);
  assert.ok(db.state.order.cancelledAt instanceof Date);
  await changeOrderStatus(orderId, "cancelled");
  assert.equal(db.state.stock[firstVariant], 5);
  assert.equal(db.state.stockUpdates, 1);
});

test("a failed later stock restoration rolls back earlier increments and status", async () => {
  const db = fakeTransaction({ secondLine: true, failSecond: true });
  await assert.rejects(changeOrderStatus(orderId, "cancelled"), { status: 409 });
  assert.equal(db.state.stock[firstVariant], 3);
  assert.equal(db.state.stock[secondVariant], 4);
  assert.equal(db.state.order.status, "pending");
});

test("shipped, delivered, and paid orders cannot be cancelled with stock restoration", async () => {
  for (const options of [
    { status: "shipped" },
    { status: "delivered" },
    { paymentStatus: "paid" },
  ]) {
    const db = fakeTransaction(options);
    await assert.rejects(changeOrderStatus(orderId, "cancelled"), { status: 409 });
    assert.equal(db.state.stockUpdates, 0);
    assert.equal(db.state.order.status, options.status ?? "pending");
    mock.restoreAll();
  }
});
