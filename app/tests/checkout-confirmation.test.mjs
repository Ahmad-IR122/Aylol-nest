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
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "test:server-only")
      return { format: "module", source: "export {};", shortCircuit: true };
    return nextLoad(url, context);
  },
});

const { Order } = await import("../src/models/Order.ts");
const { orderForCustomer } = await import("../src/lib/checkout/order-confirmation.ts");
const orderId = "507f1f77bcf86cd799439011";
const ownerId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
const otherId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439013");

afterEach(() => mock.restoreAll());

test("confirmation reads only the signed-in customer's order and displayed fields", async () => {
  const savedOrder = { _id: orderId, user: ownerId, orderNumber: "AN-20261104-ABC123" };
  const queries = [];
  mock.method(Order, "findOne", (filter) => {
    queries.push(filter);
    return {
      select(fields) {
        assert.ok(fields.includes("items.name"));
        assert.ok(fields.includes("shippingAddress.streetAddress"));
        assert.ok(!fields.includes("adminNotes"));
        return this;
      },
      async lean() {
        return String(filter.user) === String(savedOrder.user) ? savedOrder : null;
      },
    };
  });

  assert.equal(await orderForCustomer("not-an-id", ownerId), null);
  assert.equal(queries.length, 0, "malformed IDs never reach MongoDB");
  assert.equal(await orderForCustomer(orderId, otherId), null);
  assert.equal((await orderForCustomer(orderId, ownerId)).orderNumber, savedOrder.orderNumber);
  assert.equal(queries.length, 2);
  assert.ok(queries.every((filter) => filter._id === orderId && filter.user));
});
