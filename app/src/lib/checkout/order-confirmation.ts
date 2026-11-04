import "server-only";

import type mongoose from "mongoose";
import { Order } from "@/models/Order";

export async function orderForCustomer(id: string, customerId: mongoose.Types.ObjectId) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  return Order.findOne({ _id: id, user: customerId })
    .select(
      "orderNumber createdAt items.product items.variantId items.name items.sku items.size items.color items.quantity items.totalPrice items.imageUrl subtotal shippingFee total shippingRegion shippingAddress.fullName shippingAddress.phone shippingAddress.city shippingAddress.streetAddress",
    )
    .lean();
}
