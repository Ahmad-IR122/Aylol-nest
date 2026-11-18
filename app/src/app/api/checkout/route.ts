import { NextResponse } from "next/server";
import { z } from "zod";

import { cartOwner, readBody, CartApiError } from "@/lib/cart/server";
import { checkout, CheckoutError } from "@/lib/checkout/server";
import { checkoutSchema, idempotencyKeySchema } from "@/lib/checkout/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new CheckoutError(403, "Cross-origin checkout is not allowed");

    const key = idempotencyKeySchema.parse(request.headers.get("idempotency-key") ?? "");
    const input = checkoutSchema.parse(await readBody(request));
    const owner = await cartOwner();
    if (!owner) throw new CheckoutError(409, "Cart is empty");
    const order = await checkout(owner.id, input, key, owner.guest);
    return NextResponse.json(
      { orderId: order.orderId, orderNumber: order.orderNumber },
      { status: order.replayed ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof CheckoutError || error instanceof CartApiError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          message: "Invalid checkout input",
          errors: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    console.error("Checkout API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
