import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { orderErrorResponse } from "@/lib/orders/errors";
import {
  changeOrderStatus,
  getOrder,
  orderIdSchema,
  statusUpdateSchema,
} from "@/lib/orders/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const id = orderIdSchema.parse((await context.params).id);
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    return orderErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { message: "Cross-origin order update is not allowed" },
        { status: 403 },
      );
    const id = orderIdSchema.parse((await context.params).id);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    const { status } = statusUpdateSchema.parse(body);
    return NextResponse.json({ order: await changeOrderStatus(id, status) });
  } catch (error) {
    return orderErrorResponse(error);
  }
}
