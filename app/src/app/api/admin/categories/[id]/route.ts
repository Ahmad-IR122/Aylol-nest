import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/require-admin";

import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ message: error.message }, { status: 403 });
  }

  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return NextResponse.json({ message: "Category slug already exists" }, { status: 409 });
  }
  console.error("Category API error:", error);

  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

// GET /api/admin/categories/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!isValidId(id)) {
      return badRequest("Invalid category ID");
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category }, { status: 200 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!isValidId(id)) {
      return badRequest("Invalid category ID");
    }

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    if (!isRecord(body)) {
      return badRequest("Invalid request body");
    }
    const allowedFields = [
      "name",
      "slug",
      "description",
      "imageUrl",
      "parent",
      "sortOrder",
      "isActive",
    ];

    if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
      return badRequest("Request contains unsupported fields");
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!isRecord(body.name)) {
        return badRequest("Invalid name field");
      }
      const { ar, en } = body.name;
      if (typeof ar !== "string" || typeof en !== "string" || !ar.trim() || !en.trim()) {
        return badRequest("Arabic and English names are required");
      }

      updates.name = {
        ar: ar.trim(),
        en: en.trim(),
      };
    }
    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !body.slug.trim()) {
        return badRequest("invalid slug field");
      }
      const slug = body.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return badRequest("Invalid slug format");
      }

      const duplicate = await Category.exists({
        slug,
        _id: { $ne: id },
      });

      if (duplicate) {
        return NextResponse.json({ message: "Category slug already exists" }, { status: 409 });
      }

      updates.slug = slug;
    }

    if (body.description !== undefined) {
      if (!isRecord(body.description)) {
        return badRequest("Invalid description field");
      }
      if (typeof body.description.ar !== "string" ||
        typeof body.description.en !== "string"
      ) {
        return badRequest("Invalid description fields");
      }
      updates.description = {
        ar: body.description.ar.trim(),
        en: body.description.en.trim(),
      };
    }


    // Validate image URL
    if (body.imageUrl !== undefined) {
      const rawImageUrl = body.imageUrl;

      if (typeof rawImageUrl !== "string") {
        return badRequest("Invalid image URL");
      }

      const imageUrl = rawImageUrl.trim();

      if (imageUrl) {
        try {
          const url = new URL(imageUrl);

          if (
            url.protocol !== "https:" ||
            url.hostname !== "res.cloudinary.com"
          ) {
            return badRequest(
              "Image must be a Cloudinary HTTPS URL",
            );
          }
        } catch {
          return badRequest("Invalid image URL");
        }
      }

      updates.imageUrl = imageUrl;
    }

    // Validate sort order
    if (body.sortOrder !== undefined) {
      if (
        typeof body.sortOrder !== "number" ||
        !Number.isSafeInteger(body.sortOrder) ||
        body.sortOrder < 0
      ) {
        return badRequest(
          "Sort order must be a non-negative integer",
        );
      }

      updates.sortOrder = body.sortOrder;
    }

    // Validate active status
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return badRequest("isActive must be a boolean");
      }

      updates.isActive = body.isActive;
    }

    // Validate parent category
    if (body.parent !== undefined) {
      if (body.parent === null || body.parent === "") {
        updates.parent = null;
      } else {
        if (
          typeof body.parent !== "string" ||
          !isValidId(body.parent)
        ) {
          return badRequest("Invalid parent category ID");
        }

        if (body.parent.toLowerCase() === id.toLowerCase()) {
          return badRequest(
            "A category cannot be its own parent",
          );
        }

        const parentCategory = await Category.findById(
          body.parent,
        )
          .select("_id parent")
          .lean();

        if (!parentCategory) {
          return badRequest("Parent category not found");
        }


        const visited = new Set<string>([id.toLowerCase()]);

        let current: typeof parentCategory | null = parentCategory;

        while (current) {
          const currentId = String(current._id).toLowerCase();

          if (visited.has(currentId)) {
            return badRequest(
              "Cannot assign a descendant as parent",
            );
          }

          visited.add(currentId);

          if (!current.parent) {
            break;
          }

          current = await Category.findById(current.parent)
            .select("_id parent")
            .lean();
        }
        updates.parent = new mongoose.Types.ObjectId(
          body.parent,
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No fields provided for update");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return NextResponse.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

// DELETE /api/admin/categories/:id
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!isValidId(id)) {
      return badRequest("Invalid category ID");
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    // Do not delete categories containing subcategories.
    const hasChildren = await Category.exists({
      parent: category._id,
    });

    if (hasChildren) {
      return NextResponse.json(
        {
          message:
            "Cannot delete a category that contains subcategories",
        },
        { status: 409 },
      );
    }

    // Do not delete categories assigned to products.
    // Assumes Product schema uses the field "category".
    const hasProducts = await Product.exists({
      category: category._id,
    });

    if (hasProducts) {
      return NextResponse.json(
        {
          message:
            "Cannot delete a category that contains products",
        },
        { status: 409 },
      );
    }

    await Category.deleteOne({ _id: category._id });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
