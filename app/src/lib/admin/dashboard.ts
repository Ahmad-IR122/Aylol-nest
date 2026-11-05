import "server-only";

import { requireAdmin } from "@/lib/auth/require-admin";
import { connectDB } from "@/lib/db/mongoose";
import { orderStatuses, type OrderStatus } from "@/lib/orders/status";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

type RecentOrder = {
  _id: string;
  orderNumber: string;
  customer: string;
  createdAt: Date;
  total: number;
  status: OrderStatus;
};

type OrderMetrics = {
  summary: { total: number; revenue: number; pending: number }[];
  statuses: { _id: OrderStatus; count: number }[];
  recent: RecentOrder[];
  daily: { _id: string; revenue: number }[];
};

type LowStockProduct = {
  _id: string;
  name: { ar: string; en: string };
  variants: { _id: string; sku: string; size: string; stock: number }[];
};

type ProductMetrics = {
  count: { total: number }[];
  lowStockCount: { total: number }[];
  lowStock: LowStockProduct[];
};

export async function getDashboardData() {
  await requireAdmin();
  await connectDB();
  const today = new Date();
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6),
  );
  const lowStockFilter = {
    isActive: true,
    variants: { $elemMatch: { isActive: true, stock: { $lt: 5 } } },
  };

  const [orderResult, productResult, customers] = await Promise.all([
    Order.aggregate<OrderMetrics>([
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                revenue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$status", "delivered"] },
                          { $ne: ["$paymentStatus", "refunded"] },
                        ],
                      },
                      "$total",
                      0,
                    ],
                  },
                },
              },
            },
          ],
          statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          recent: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: { $toString: "$_id" },
                orderNumber: 1,
                customer: "$shippingAddress.fullName",
                createdAt: 1,
                total: 1,
                status: 1,
              },
            },
          ],
          daily: [
            {
              $match: {
                status: "delivered",
                paymentStatus: { $ne: "refunded" },
                deliveredAt: { $gte: start },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt", timezone: "UTC" },
                },
                revenue: { $sum: "$total" },
              },
            },
          ],
        },
      },
    ]),
    Product.aggregate<ProductMetrics>([
      {
        $facet: {
          count: [{ $match: { isActive: true } }, { $count: "total" }],
          lowStockCount: [{ $match: lowStockFilter }, { $count: "total" }],
          lowStock: [
            { $match: lowStockFilter },
            { $sort: { "variants.stock": 1, _id: 1 } },
            { $limit: 5 },
            {
              $project: {
                name: 1,
                variants: {
                  $filter: {
                    input: "$variants",
                    as: "variant",
                    cond: {
                      $and: [
                        { $eq: ["$$variant.isActive", true] },
                        { $lt: ["$$variant.stock", 5] },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]),
    User.countDocuments({ role: "customer" }),
  ]);

  const orders = orderResult[0];
  const products = productResult[0];
  const revenueByDay = new Map(orders.daily.map((day) => [day._id, day.revenue]));

  return {
    totalOrders: orders.summary[0]?.total ?? 0,
    totalRevenue: orders.summary[0]?.revenue ?? 0,
    pendingOrders: orders.summary[0]?.pending ?? 0,
    totalCustomers: customers,
    totalProducts: products.count[0]?.total ?? 0,
    lowStockCount: products.lowStockCount[0]?.total ?? 0,
    lowStock: products.lowStock,
    recentOrders: orders.recent,
    statuses: orderStatuses.map((status) => ({
      status,
      count: orders.statuses.find((item) => item._id === status)?.count ?? 0,
    })),
    revenueDays: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, revenue: revenueByDay.get(key) ?? 0 };
    }),
  };
}
