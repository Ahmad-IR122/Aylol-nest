import type { OrderStatus } from "@/lib/orders/status";

export type AdminOrderSummary = {
  _id: string;
  orderNumber: string;
  shippingAddress: { fullName: string; phone: string };
  createdAt: string;
  total: number;
  paymentStatus: string;
  status: OrderStatus;
};

export type AdminOrder = AdminOrderSummary & {
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    area?: string;
    streetAddress: string;
    building?: string;
  };
  shippingRegion: "west_bank" | "jerusalem" | "inside_48";
  customerNotes?: string;
  items: {
    product: string;
    variantId: string;
    sku: string;
    name?: { ar: string; en: string };
    imageUrl: string;
    size: string;
    color?: { ar: string; en: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  shippingFee: number;
  currency: "ILS";
  paymentMethod: string;
  updatedAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
};

export type AdminOrderList = {
  orders: AdminOrderSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
