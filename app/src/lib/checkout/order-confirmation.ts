import "server-only";

import type mongoose from "mongoose";
import { Order } from "@/models/Order";

export async function orderForCustomer(
  id: string,
  ownerId: mongoose.Types.ObjectId,
  guest = false,
) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const ownership = guest ? { guestOwner: ownerId } : { user: ownerId };
  return Order.findOne({ _id: id, ...ownership })
    .select(
      "orderNumber createdAt items.product items.variantId items.name items.sku items.size items.color items.quantity items.totalPrice items.imageUrl subtotal shippingFee total shippingRegion shippingZoneName shippingAddress.fullName shippingAddress.phone shippingAddress.city shippingAddress.streetAddress",
    )
    .lean();
}
