import "server-only";

import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ContactMessage } from "@/models/ContactMessage";

export async function listContactMessages(page: number) {
  await requireAdmin();
  const pageSize = 20;
  const [total, rows] = await Promise.all([
    ContactMessage.countDocuments(),
    ContactMessage.find()
      .select("fullName email phone subject message status createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);
  return {
    totalPages: Math.ceil(total / pageSize),
    messages: rows.map((row) => ({
      id: row._id.toString(),
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      status: row.status === "handled" ? "handled" : "new",
      createdAt: row.createdAt,
    })),
  };
}

export async function setContactMessageStatus(id: string, status: "new" | "handled") {
  await requireAdmin();
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid contact message ID");
  await ContactMessage.updateOne({ _id: id }, { $set: { status } });
}
