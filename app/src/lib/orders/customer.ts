import "server-only";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import type mongoose from "mongoose";

import { getCurrentCartUser } from "@/lib/auth/current-user";
import { Order } from "@/models/Order";

const pageSize = 10;

export async function requireOrderCustomer(locale: string, returnPath: string) {
  const { userId } = await auth();
  if (!userId)
    redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(`/${locale}${returnPath}`)}`);

  const user = await getCurrentCartUser();
  if (!user || user.role !== "customer") notFound();
  return user;
}

export async function listCustomerOrders(customerId: mongoose.Types.ObjectId, page: number) {
  const filter = { user: customerId };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select("orderNumber createdAt total status items.quantity")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, totalPages: Math.ceil(total / pageSize) };
}

export async function getCustomerOrder(customerId: mongoose.Types.ObjectId, orderId: string) {
  if (!/^[a-f\d]{24}$/i.test(orderId)) return null;
  return Order.findOne({ _id: orderId, user: customerId })
    .select(
      "orderNumber createdAt status paymentMethod paymentStatus items.name items.imageUrl items.sku items.size items.color items.quantity items.unitPrice items.totalPrice subtotal shippingFee total shippingRegion shippingAddress customerNotes",
    )
    .lean();
}
