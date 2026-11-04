import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { orderErrorResponse } from "@/lib/orders/errors";
import { listOrders, parseOrderQuery } from "@/lib/orders/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    return NextResponse.json(await listOrders(parseOrderQuery(request.nextUrl.searchParams)));
  } catch (error) {
    return orderErrorResponse(error);
  }
}
