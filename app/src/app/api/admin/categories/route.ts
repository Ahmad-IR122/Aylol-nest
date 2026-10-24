
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/require-admin";

import { Category } from "@/models/Category";

export const runtime = "nodejs";

// Handle authentication and authorization errors
function handleError(error: unknown, operation: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { message: error.message },
      { status: 401 },
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { message: error.message },
      { status: 403 },
    );
  }

  // MongoDB duplicate key error
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return NextResponse.json(
      { message: "Category slug already exists" },
      { status: 409 },
    );
  }

  console.error(`${operation} categories error:`, error);

  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 },
  );
}

// GET /api/admin/categories
// Retrieve all categories (admin only)
export async function GET() {
  try {
    await requireAdmin();

    const categories = await Category.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      { categories },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleError(error, "GET");
  }
}

// POST /api/admin/categories
// Create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return NextResponse.json(
          { message: "Invalid request body" },
          { status: 400 },
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const name = body.name as
      | { ar?: unknown; en?: unknown }
      | undefined;

    const description = body.description as
      | { ar?: unknown; en?: unknown }
      | undefined;

    const nameAr =
      typeof name?.ar === "string" ? name.ar.trim() : "";

    const nameEn =
      typeof name?.en === "string" ? name.en.trim() : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";

    const descriptionAr =
      typeof description?.ar === "string"
        ? description.ar.trim()
        : "";

    const descriptionEn =
      typeof description?.en === "string"
        ? description.en.trim()
        : "";

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";

    // Validate required fields
    if (!nameAr || !nameEn || !slug) {
      return NextResponse.json(
        {
          message:
            "Arabic name, English name and slug are required",
        },
        { status: 400 },
      );
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        {
          message:
            "Slug must contain lowercase letters, numbers and hyphens only",
        },
        { status: 400 },
      );
    }

    // Validate image URL
    if (imageUrl) {
      try {
        const url = new URL(imageUrl);

        if (
          url.protocol !== "https:" ||
          url.hostname !== "res.cloudinary.com"
        ) {
          return NextResponse.json(
            {
              message: "Image must be a Cloudinary HTTPS URL",
            },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json(
          { message: "Invalid image URL" },
          { status: 400 },
        );
      }
    }

    // Validate sort order
    const sortOrder =
      body.sortOrder === undefined ? 0 : body.sortOrder;

    if (
      typeof sortOrder !== "number" ||
      !Number.isSafeInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          message: "Sort order must be a non-negative integer",
        },
        { status: 400 },
      );
    }

    // Validate isActive
    if (
      body.isActive !== undefined &&
      typeof body.isActive !== "boolean"
    ) {
      return NextResponse.json(
        { message: "isActive must be a boolean" },
        { status: 400 },
      );
    }

    // Validate parent category
    let parent: mongoose.Types.ObjectId | null = null;

    if (body.parent !== undefined && body.parent !== null && body.parent !== "") {
      if (
        typeof body.parent !== "string" ||
        !mongoose.isValidObjectId(body.parent)
      ) {
        return NextResponse.json(
          { message: "Invalid parent category ID" },
          { status: 400 },
        );
      }

      const parentCategory = await Category.findById(body.parent)
        .select("_id")
        .lean();

      if (!parentCategory) {
        return NextResponse.json(
          { message: "Parent category not found" },
          { status: 400 },
        );
      }

      parent = parentCategory._id;
    }

    // Check duplicate slug
    const existingCategory = await Category.exists({ slug });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category slug already exists" },
        { status: 409 },
      );
    }

    // Create category
    const category = await Category.create({
      name: {
        ar: nameAr,
        en: nameEn,
      },
      slug,
      description: {
        ar: descriptionAr,
        en: descriptionEn,
      },
      imageUrl,
      parent,
      sortOrder,
      isActive:
        typeof body.isActive === "boolean"
          ? body.isActive
          : true,
    });

    return NextResponse.json(
      {
        message: "Category created successfully",
        category,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleError(error, "POST");
  }
}
