import "server-only";

import { createHash, randomBytes } from "node:crypto";
import mongoose, { type ClientSession } from "mongoose";

import { shippingFeeFor, priceInCents, type CheckoutInput } from "@/lib/checkout/validation";
import { Cart } from "@/models/Cart";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export class CheckoutError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type CheckoutResult = { orderId: string; orderNumber: string; replayed: boolean };

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function orderNumber() {
  return `AN-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(12).toString("hex").toUpperCase()}`;
}

async function existingOrder(
  owner: mongoose.Types.ObjectId,
  idempotencyKeyHash: string,
  requestHash: string,
  session?: ClientSession,
): Promise<CheckoutResult | null> {
  const query = Order.findOne({ user: owner, idempotencyKeyHash }).select(
    "_id orderNumber requestHash",
  );
  if (session) query.session(session);
  const order = await query.lean();
  if (!order) return null;
  if (order.requestHash !== requestHash)
    throw new CheckoutError(409, "Idempotency key was used with different checkout details");
  return { orderId: order._id.toString(), orderNumber: order.orderNumber, replayed: true };
}

async function placeOrderInTransaction(
  owner: mongoose.Types.ObjectId,
  input: CheckoutInput,
  idempotencyKeyHash: string,
  requestHash: string,
  session: ClientSession,
): Promise<CheckoutResult> {
  const replay = await existingOrder(owner, idempotencyKeyHash, requestHash, session);
  if (replay) return replay;

  const cart = await Cart.findOne({ owner }).session(session).lean();
  if (!cart?.items.length) throw new CheckoutError(409, "Cart is empty");

  const selections = new Map<
    string,
    { productId: mongoose.Types.ObjectId; variantId: mongoose.Types.ObjectId; quantity: number }
  >();
  for (const line of cart.items) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1)
      throw new CheckoutError(409, "Cart contains an invalid quantity");
    const key = `${line.product}:${line.variantId}`;
    const previous = selections.get(key);
    const quantity = (previous?.quantity ?? 0) + line.quantity;
    if (!Number.isSafeInteger(quantity))
      throw new CheckoutError(409, "Cart contains an invalid quantity");
    selections.set(key, { productId: line.product, variantId: line.variantId, quantity });
  }

  const products = await Product.find({
    _id: { $in: [...new Set([...selections.values()].map((line) => line.productId.toString()))] },
  })
    .session(session)
    .lean();
  const catalog = new Map(products.map((product) => [product._id.toString(), product]));
  let subtotalCents = 0;
  const items = [];

  for (const selection of selections.values()) {
    const product = catalog.get(selection.productId.toString());
    const variant = product?.variants.find(
      (item) => item._id.toString() === selection.variantId.toString(),
    );
    if (!product?.isActive || !variant?.isActive)
      throw new CheckoutError(409, "Product or variant is unavailable");
    if (
      !product.name?.ar ||
      !product.name.en ||
      !variant.sku ||
      !variant.size ||
      !variant.color?.name?.ar ||
      !variant.color.name.en
    )
      throw new CheckoutError(409, "Product details are unavailable");
    if (!Number.isSafeInteger(variant.stock) || variant.stock < selection.quantity)
      throw new CheckoutError(409, "Insufficient stock");
    const unitCents = priceInCents(variant.price);
    if (unitCents === null) throw new CheckoutError(409, "Product price is unavailable");
    const lineCents = unitCents * selection.quantity;
    subtotalCents += lineCents;
    if (!Number.isSafeInteger(lineCents) || !Number.isSafeInteger(subtotalCents))
      throw new CheckoutError(409, "Cart total is too large");

    items.push({
      product: product._id,
      variantId: variant._id,
      sku: variant.sku,
      name: { ar: product.name.ar, en: product.name.en },
      imageUrl: variant.images[0]?.url ?? product.images[0]?.url ?? "",
      size: variant.size,
      color: { ar: variant.color.name.ar, en: variant.color.name.en },
      quantity: selection.quantity,
      unitPrice: unitCents / 100,
      totalPrice: lineCents / 100,
    });
  }

  // Sequential writes are required within one MongoDB transaction.
  for (const selection of selections.values()) {
    const update = await Product.updateOne(
      {
        _id: selection.productId,
        isActive: true,
        variants: {
          $elemMatch: {
            _id: selection.variantId,
            isActive: true,
            stock: { $gte: selection.quantity },
          },
        },
      },
      { $inc: { "variants.$.stock": -selection.quantity } },
      { session },
    );
    if (update.modifiedCount !== 1)
      throw new CheckoutError(409, "Insufficient stock or variant unavailable");
  }

  const shippingFee = shippingFeeFor(input.region);
  const totalCents = subtotalCents + shippingFee * 100;
  if (!Number.isSafeInteger(totalCents)) throw new CheckoutError(409, "Cart total is too large");
  const orderId = new mongoose.Types.ObjectId(idempotencyKeyHash.slice(0, 24));
  const [order] = await Order.create(
    [
      {
        _id: orderId,
        orderNumber: orderNumber(),
        idempotencyKeyHash,
        requestHash,
        user: owner,
        items,
        shippingAddress: {
          fullName: input.customerName,
          phone: input.phone,
          city: input.city,
          streetAddress: input.address,
        },
        shippingRegion: input.region,
        customerNotes: input.notes,
        subtotal: subtotalCents / 100,
        shippingFee,
        total: totalCents / 100,
        paymentMethod: "cash_on_delivery",
        paymentStatus: "unpaid",
        status: "pending",
      },
    ],
    { session },
  );

  const cleared = await Cart.updateOne(
    { _id: cart._id, owner, revision: cart.revision },
    { $set: { items: [] }, $inc: { revision: 1 } },
    { session },
  );
  if (cleared.modifiedCount !== 1) throw new CheckoutError(409, "Cart changed; retry checkout");

  return { orderId: order._id.toString(), orderNumber: order.orderNumber, replayed: false };
}

export async function checkout(
  owner: mongoose.Types.ObjectId,
  input: CheckoutInput,
  idempotencyKey: string,
): Promise<CheckoutResult> {
  const idempotencyKeyHash = hash(`${owner}:${idempotencyKey.toLowerCase()}`);
  const requestHash = hash(JSON.stringify(input));

  // Ensure the unique indexes exist before accepting any checkout request.
  await Order.init();
  const replay = await existingOrder(owner, idempotencyKeyHash, requestHash);
  if (replay) return replay;

  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(
      () => placeOrderInTransaction(owner, input, idempotencyKeyHash, requestHash, session),
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      },
    );
    if (!result)
      throw new CheckoutError(503, "Checkout result is uncertain; retry with the same key");
    return result;
  } catch (error) {
    // A commit may have succeeded even if its acknowledgement was lost.
    const committed = await existingOrder(owner, idempotencyKeyHash, requestHash);
    if (committed) return committed;
    if (error instanceof CheckoutError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000)
      throw new CheckoutError(409, "Order conflict; retry checkout");
    throw new CheckoutError(503, "Transactional checkout unavailable; retry with the same key");
  } finally {
    await session.endSession();
  }
}
