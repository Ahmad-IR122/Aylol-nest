import "server-only";

import mongoose, { type ClientSession } from "mongoose";
import { z } from "zod";

import { canTransitionOrder, orderStatuses, type OrderStatus } from "@/lib/orders/status";
import { Order, type IOrder } from "@/models/Order";
import { Product } from "@/models/Product";

export const orderIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const statusUpdateSchema = z.strictObject({ status: z.enum(orderStatuses) });
export const orderListSchema = z.strictObject({
  search: z.string().trim().max(120).default(""),
  status: z.union([z.enum(orderStatuses), z.literal("")]).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export class OrderApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function parseOrderQuery(params: URLSearchParams) {
  const allowed = new Set(["search", "status", "page", "limit"]);
  for (const key of params.keys()) {
    if (!allowed.has(key) || params.getAll(key).length !== 1)
      throw new OrderApiError(400, "Invalid order query");
  }
  return orderListSchema.parse(Object.fromEntries(params));
}

export function escapeOrderSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const listFields =
  "orderNumber shippingAddress.fullName shippingAddress.phone createdAt total paymentStatus status";
const detailFields =
  "orderNumber shippingAddress shippingRegion customerNotes items.product items.variantId items.sku items.name items.imageUrl items.size items.color items.quantity items.unitPrice items.totalPrice subtotal shippingFee total currency paymentMethod paymentStatus status createdAt updatedAt deliveredAt cancelledAt";

export async function listOrders(input: z.infer<typeof orderListSchema>) {
  const filter: mongoose.QueryFilter<IOrder> = {};
  if (input.status) filter.status = input.status;
  if (input.search) {
    const search = { $regex: escapeOrderSearch(input.search), $options: "i" };
    filter.$or = [{ orderNumber: search }, { "shippingAddress.fullName": search }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select(listFields)
      .sort({ createdAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  return {
    orders,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getOrder(id: string) {
  return Order.findById(id).select(detailFields).lean();
}

function restorationLines(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>) {
  const lines = new Map<
    string,
    { product: mongoose.Types.ObjectId; variantId: mongoose.Types.ObjectId; quantity: number }
  >();
  for (const item of order.items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1)
      throw new OrderApiError(409, "Order has an invalid inventory quantity");
    const key = `${item.product}:${item.variantId}`;
    const quantity = (lines.get(key)?.quantity ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity))
      throw new OrderApiError(409, "Order has an invalid inventory quantity");
    lines.set(key, { product: item.product, variantId: item.variantId, quantity });
  }
  return [...lines.values()];
}

async function updateInTransaction(id: string, next: OrderStatus, session: ClientSession) {
  const order = await Order.findById(id).select(detailFields).session(session).lean();
  if (!order) throw new OrderApiError(404, "Order not found");
  const current = order.status as OrderStatus;
  if (current === next) return order;
  if (!orderStatuses.includes(current) || !canTransitionOrder(current, next))
    throw new OrderApiError(409, "Order status transition is not allowed");

  if (next === "cancelled") {
    if (order.paymentStatus !== "unpaid")
      throw new OrderApiError(409, "Paid orders require a separate return workflow");
    for (const line of restorationLines(order)) {
      const result = await Product.updateOne(
        {
          _id: line.product,
          variants: {
            $elemMatch: {
              _id: line.variantId,
              stock: { $lte: Number.MAX_SAFE_INTEGER - line.quantity },
            },
          },
        },
        { $inc: { "variants.$.stock": line.quantity } },
        { session },
      );
      if (result.modifiedCount !== 1)
        throw new OrderApiError(409, "Product variant is unavailable for stock restoration");
    }
  }

  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    { _id: id, status: current },
    {
      $set: {
        status: next,
        ...(next === "cancelled" ? { cancelledAt: now } : {}),
        ...(next === "delivered" ? { deliveredAt: now } : {}),
      },
    },
    { new: true, runValidators: true, session },
  )
    .select(detailFields)
    .lean();
  if (!updated) throw new OrderApiError(409, "Order changed; reload and retry");
  return updated;
}

export async function changeOrderStatus(id: string, next: OrderStatus) {
  const session = await mongoose.startSession();
  try {
    const order = await session.withTransaction(() => updateInTransaction(id, next, session), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });
    if (!order) throw new OrderApiError(503, "Order update result is uncertain; reload the order");
    return order;
  } catch (error) {
    if (error instanceof OrderApiError) throw error;
    throw new OrderApiError(503, "Transactional order update unavailable; reload the order");
  } finally {
    await session.endSession();
  }
}
