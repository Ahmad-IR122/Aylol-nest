import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ForbiddenError, UnauthorizedError } from "@/lib/auth/require-admin";
import { OrderApiError } from "@/lib/orders/server";

export function orderErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError)
    return NextResponse.json({ message: error.message }, { status: 401 });
  if (error instanceof ForbiddenError)
    return NextResponse.json({ message: error.message }, { status: 403 });
  if (error instanceof OrderApiError)
    return NextResponse.json({ message: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        message: "Invalid order input",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  if (error instanceof mongoose.Error.CastError)
    return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
  console.error("Admin orders API error:", error);
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}
