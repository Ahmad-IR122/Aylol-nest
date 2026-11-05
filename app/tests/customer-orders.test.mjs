import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { afterEach, mock, test } from "node:test";
import mongoose from "mongoose";

const root = new URL("../src/", import.meta.url);
const authUrl = new URL("lib/auth/current-user.ts", root).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "test:server-only", shortCircuit: true };
    if (specifier === "@clerk/nextjs/server") return { url: "test:clerk", shortCircuit: true };
    if (specifier === "next/navigation") return { url: "test:navigation", shortCircuit: true };
    if (specifier.startsWith("@/"))
      return { url: new URL(`${specifier.slice(2)}.ts`, root).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "test:server-only")
      return { format: "module", source: "export {};", shortCircuit: true };
    if (url === "test:clerk")
      return {
        format: "module",
        source: `export let userId = null;
          export function setUserId(value) { userId = value; }
          export async function auth() { return { userId }; }`,
        shortCircuit: true,
      };
    if (url === "test:navigation")
      return {
        format: "module",
        source: `export function redirect(path) { throw new Error("redirect:" + path); }
          export function notFound() { throw new Error("not-found"); }`,
        shortCircuit: true,
      };
    if (url === authUrl)
      return {
        format: "module",
        source: `export let customer = null;
          export function setCustomer(value) { customer = value; }
          export async function getCurrentCartUser() { return customer; }`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

const { Order } = await import("../src/models/Order.ts");
const { getCustomerOrder, listCustomerOrders, requireOrderCustomer } =
  await import("../src/lib/orders/customer.ts");
const clerk = await import("test:clerk");
const user = await import(authUrl);
const ownerA = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
const ownerB = new mongoose.Types.ObjectId("507f1f77bcf86cd799439013");
const orderId = "507f1f77bcf86cd799439011";

afterEach(() => {
  mock.restoreAll();
  clerk.setUserId(null);
  user.setCustomer(null);
});

test("private pages require Clerk and an active MongoDB customer", async () => {
  await assert.rejects(requireOrderCustomer("en", "/orders"), /redirect:\/en\/sign-in/);
  clerk.setUserId("clerk-a");
  await assert.rejects(requireOrderCustomer("en", "/orders"), /not-found/);
  user.setCustomer({ _id: ownerA, role: "admin" });
  await assert.rejects(requireOrderCustomer("en", "/orders"), /not-found/);
  user.setCustomer({ _id: ownerA, role: "customer" });
  assert.equal((await requireOrderCustomer("en", "/orders"))._id, ownerA);
});

test("order list filters by customer, paginates newest first, and supports empty history", async () => {
  let filter;
  const chain = {
    select(fields) {
      assert.ok(fields.includes("items.quantity"));
      assert.ok(!fields.includes("adminNotes"));
      return this;
    },
    sort(value) {
      assert.deepEqual(value, { createdAt: -1, _id: -1 });
      return this;
    },
    skip(value) {
      assert.equal(value, 10);
      return this;
    },
    limit(value) {
      assert.equal(value, 10);
      return this;
    },
    async lean() {
      return [];
    },
  };
  mock.method(Order, "find", (value) => {
    filter = value;
    return chain;
  });
  mock.method(Order, "countDocuments", async (value) => {
    assert.deepEqual(value, { user: ownerA });
    return 0;
  });
  assert.deepEqual(await listCustomerOrders(ownerA, 2), { orders: [], totalPages: 0 });
  assert.deepEqual(filter, { user: ownerA });
});

test("details reject another customer and use immutable snapshots without product lookup", async () => {
  const snapshot = {
    orderNumber: "AN-20261105-ABC",
    items: [{ name: { ar: "اسم محفوظ", en: "Saved name" }, unitPrice: 20, totalPrice: 40 }],
  };
  let queries = 0;
  mock.method(Order, "findOne", (filter) => {
    queries++;
    assert.equal(filter._id, orderId);
    return {
      select(fields) {
        assert.ok(fields.includes("items.name"));
        assert.ok(fields.includes("items.unitPrice"));
        assert.ok(fields.includes("items.totalPrice"));
        assert.ok(!fields.includes("adminNotes"));
        return this;
      },
      async lean() {
        return String(filter.user) === String(ownerA) ? snapshot : null;
      },
    };
  });
  assert.equal(await getCustomerOrder(ownerA, "bad-id"), null);
  assert.equal(queries, 0);
  assert.equal(await getCustomerOrder(ownerB, orderId), null);
  assert.equal((await getCustomerOrder(ownerA, orderId)).items[0].name.en, "Saved name");
});

test("both locales cover every model status and payment state", async () => {
  const { orderStatuses } = await import("../src/lib/orders/status.ts");
  for (const locale of ["en", "ar"]) {
    const messages = JSON.parse(
      await readFile(new URL(`../messages/${locale}.json`, import.meta.url)),
    );
    for (const status of orderStatuses) assert.ok(messages.CustomerOrders.statuses[status]);
    for (const status of ["unpaid", "paid", "failed", "refunded"])
      assert.ok(messages.CustomerOrders.payments[status]);
  }
});
