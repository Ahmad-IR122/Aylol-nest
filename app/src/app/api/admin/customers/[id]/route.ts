import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/require-admin";
import { User } from "@/models/User";

export const runtime = "nodejs";

const editSchema = z.strictObject({
  firstName: z.string().trim().max(100),
  lastName: z.string().trim().max(100),
  phone: z
    .string()
    .trim()
    .max(10)
    .refine((value) => value === "" || /^(?:059|056)[0-9]{7}$/.test(value)),
  isActive: z.boolean(),
});

type Context = { params: Promise<{ id: string }> };

function isClerkUserMissing(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError)
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  if (error instanceof ForbiddenError)
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  console.error("Admin customer mutation failed:", error);
  return NextResponse.json({ message: "Customer update failed" }, { status: 503 });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id))
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = editSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ message: "Invalid customer details" }, { status: 400 });

    const customer = await User.findOne({ _id: id, role: "customer", deletedAt: null })
      .select("clerkId firstName lastName")
      .lean();
    if (!customer) return NextResponse.json({ message: "Customer not found" }, { status: 404 });

    let identityMissing = false;
    const clerk = await clerkClient();
    try {
      if (
        customer.firstName !== parsed.data.firstName ||
        customer.lastName !== parsed.data.lastName
      ) {
        await clerk.users.updateUser(customer.clerkId, {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
        });
      } else {
        await clerk.users.getUser(customer.clerkId);
      }
    } catch (error) {
      if (!isClerkUserMissing(error)) throw error;
      identityMissing = true;
    }
    const result = await User.updateOne(
      { _id: id, role: "customer", deletedAt: null },
      { $set: { ...parsed.data, isActive: identityMissing ? false : parsed.data.isActive } },
    );
    if (result.matchedCount !== 1)
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    return NextResponse.json({ message: "Customer updated", identityMissing });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id))
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 });

    const customer = await User.findOne({ _id: id, role: "customer" }).select("clerkId").lean();
    if (!customer) return NextResponse.json({ message: "Customer not found" }, { status: 404 });

    const clerk = await clerkClient();
    try {
      await clerk.users.deleteUser(customer.clerkId);
    } catch (error) {
      if (!isClerkUserMissing(error)) throw error;
    }
    const result = await User.updateOne(
      { _id: id, role: "customer" },
      {
        $set: {
          firstName: "",
          lastName: "",
          email: `deleted-${id}@invalid.local`,
          imageUrl: "",
          phone: "",
          isActive: false,
          deletedAt: new Date(),
        },
      },
    );
    if (result.matchedCount !== 1)
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    return NextResponse.json({ message: "Customer deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
