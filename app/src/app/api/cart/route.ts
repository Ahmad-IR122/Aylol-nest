import { cartOwner, cartResponse, ensureCart, errorResponse, mutateCart } from "@/lib/cart/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const owner = await cartOwner();
    if (owner && !owner.guest) await ensureCart(owner.id);
    return cartResponse(owner?.id);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const owner = await cartOwner();
    if (owner) await mutateCart(owner.id, () => []);
    return cartResponse(owner?.id);
  } catch (error) {
    return errorResponse(error);
  }
}
