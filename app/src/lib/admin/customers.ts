import "server-only";

import mongoose, { type PipelineStage } from "mongoose";

import { requireAdmin } from "@/lib/auth/require-admin";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

const pageSize = 12;

export type CustomerSummary = {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  phone: string | null;
  profilePhone: string;
  totalOrders: number;
  totalSpent: number;
};

const orderStats = [
  { $match: { $expr: { $eq: ["$user", "$$customerId"] } } },
  { $sort: { createdAt: -1, _id: -1 } },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalSpent: {
        $sum: {
          $cond: [
            { $and: [{ $eq: ["$status", "delivered"] }, { $ne: ["$paymentStatus", "refunded"] }] },
            "$total",
            0,
          ],
        },
      },
      phone: { $first: "$shippingAddress.phone" },
    },
  },
] satisfies NonNullable<PipelineStage.Lookup["$lookup"]["pipeline"]>;

const withStats: PipelineStage[] = [
  {
    $lookup: {
      from: Order.collection.name,
      let: { customerId: "$_id" },
      pipeline: orderStats,
      as: "orderStats",
    },
  },
  {
    $project: {
      firstName: 1,
      lastName: 1,
      email: 1,
      isActive: 1,
      createdAt: 1,
      profilePhone: { $ifNull: ["$phone", ""] },
      phone: {
        $ifNull: [
          { $cond: [{ $eq: [{ $ifNull: ["$phone", ""] }, ""] }, null, "$phone"] },
          { $ifNull: [{ $arrayElemAt: ["$orderStats.phone", 0] }, null] },
        ],
      },
      totalOrders: { $ifNull: [{ $arrayElemAt: ["$orderStats.totalOrders", 0] }, 0] },
      totalSpent: { $ifNull: [{ $arrayElemAt: ["$orderStats.totalSpent", 0] }, 0] },
    },
  },
];

export function parseCustomerFilters(params: {
  search?: string | string[];
  status?: string | string[];
  page?: string | string[];
}) {
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 120) : "";
  const status = params.status === "active" || params.status === "inactive" ? params.status : "";
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
  return { search, status, page };
}

export async function listCustomers(filters: ReturnType<typeof parseCustomerFilters>) {
  await requireAdmin();
  const match: Record<string, unknown> = { role: "customer", deletedAt: null };
  if (filters.status) match.isActive = filters.status === "active";
  if (filters.search) {
    const search = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: {
              $concat: [{ $ifNull: ["$firstName", ""] }, " ", { $ifNull: ["$lastName", ""] }],
            },
            regex: search,
            options: "i",
          },
        },
      },
    ];
  }

  const [total, customers] = await Promise.all([
    User.countDocuments(match),
    User.aggregate<CustomerSummary>([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: (filters.page - 1) * pageSize },
      { $limit: pageSize },
      ...withStats,
    ]),
  ]);
  return { customers, total, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getCustomer(id: string) {
  await requireAdmin();
  if (!mongoose.isValidObjectId(id)) return null;
  const customerId = new mongoose.Types.ObjectId(id);
  const [customer] = await User.aggregate<CustomerSummary>([
    { $match: { _id: customerId, role: "customer", deletedAt: null } },
    ...withStats,
  ]);
  if (!customer) return null;
  const recentOrders = await Order.find({ user: customerId })
    .select("orderNumber createdAt total status")
    .sort({ createdAt: -1, _id: -1 })
    .limit(10)
    .lean();
  return { customer, recentOrders };
}
