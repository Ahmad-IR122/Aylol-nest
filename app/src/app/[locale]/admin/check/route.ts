import { NextResponse } from "next/server";

import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/auth/require-admin";

export async function GET() {
  try {
    const user = await requireAdmin();

    return NextResponse.json({
      success: true,
      role: user.role,
      message: "Admin access granted",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("Admin check failed:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
