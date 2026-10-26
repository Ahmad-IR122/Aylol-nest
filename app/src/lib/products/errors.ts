import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ForbiddenError, UnauthorizedError } from "@/lib/auth/require-admin";
import { ProductInputError } from "./validation";

export function productErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ message: error.message }, { status: 403 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Invalid product input",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }
  if (error instanceof ProductInputError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    return NextResponse.json({ message: "Invalid product data" }, { status: 400 });
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return NextResponse.json({ message: "Product slug already exists" }, { status: 409 });
  }
  console.error("Product API error:", error);
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}
