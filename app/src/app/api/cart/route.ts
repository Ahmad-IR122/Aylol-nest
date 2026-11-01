import { cartResponse, ensureCart, errorResponse, mutateCart, ownerId } from "@/lib/cart/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const owner = await ownerId();
    await ensureCart(owner);
    return cartResponse(owner);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const owner = await ownerId();
    await mutateCart(owner, () => []);
    return cartResponse(owner);
  } catch (error) {
    return errorResponse(error);
  }
}
