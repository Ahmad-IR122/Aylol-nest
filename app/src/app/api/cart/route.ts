import { NextResponse } from "next/server";
import { Cart } from "@/models/Cart";
import { cartResponse, errorResponse, ownerId } from "@/lib/cart/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    return await cartResponse(await ownerId());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const owner = await ownerId();
    await Cart.deleteOne({ owner });
    return NextResponse.json({ cart: { id: null, items: [], subtotal: 0, itemCount: 0 } });
  } catch (error) {
    return errorResponse(error);
  }
}
