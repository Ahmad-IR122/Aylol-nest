import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { productErrorResponse } from "@/lib/products/errors";
import {
  objectIdSchema,
  ProductInputError,
  readProductBody,
  setProductFields,
  updateProductSchema,
  validateVariantIdentities,
} from "@/lib/products/validation";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

function notFound() {
  return NextResponse.json({ message: "Product not found" }, { status: 404 });
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const id = objectIdSchema.parse((await params).id);
    const product = await Product.findById(id)
      .populate({ path: "category", model: Category, select: "name slug" })
      .lean();
    return product ? NextResponse.json({ product }) : notFound();
  } catch (error: unknown) {
    return productErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const id = objectIdSchema.parse((await params).id);
    const input = updateProductSchema.parse(await readProductBody(request));
    const existing = await Product.findById(id);
    if (!existing) return notFound();
    if (input.category !== undefined && !(await Category.exists({ _id: input.category }))) {
      throw new ProductInputError("Category not found");
    }
    if (
      input.slug !== undefined &&
      (await Product.exists({ slug: input.slug, _id: { $ne: id } }))
    ) {
      return NextResponse.json({ message: "Product slug already exists" }, { status: 409 });
    }

    const { variants, ...fields } = input;
    setProductFields((path, value) => existing.set(path, value), fields);
    const seen = new Set<string>();
    for (const variant of variants ?? []) {
      if ("_id" in variant) {
        const variantId = variant._id.toLowerCase();
        const index = existing.variants.findIndex((item) => String(item._id) === variantId);
        if (index === -1 || seen.has(variantId)) {
          throw new ProductInputError("Unknown or repeated variant ID");
        }
        seen.add(variantId);
        const { _id, ...changes } = variant;
        // Keep the original subdocument ID because orders reference it.
        void _id;
        setProductFields((path, value) => existing.set(path, value), changes, `variants.${index}`);
      } else {
        existing.variants.push(variant);
      }
    }
    if (!existing.isModified()) {
      await existing.populate({ path: "category", model: Category, select: "name slug" });
      return NextResponse.json({ message: "Product updated successfully", product: existing });
    }
    validateVariantIdentities(existing.variants);
    await existing.validate();

    // Compare the version read above so concurrent admin edits cannot overwrite
    // inventory or shift a variant index beneath this request.
    const version: unknown = existing.get("__v");
    const product = await Product.findOneAndUpdate(
      { _id: id, __v: typeof version === "number" ? version : { $exists: false } },
      { ...existing.$getChanges(), $inc: { __v: 1 } },
      { new: true, runValidators: true },
    )
      .populate({ path: "category", model: Category, select: "name slug" })
      .lean();
    if (!product) {
      if (!(await Product.exists({ _id: id }))) return notFound();
      return NextResponse.json(
        { message: "Product changed concurrently; reload and retry" },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Product updated successfully", product });
  } catch (error: unknown) {
    return productErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const id = objectIdSchema.parse((await params).id);
    if (!(await Product.exists({ _id: id }))) return notFound();
    // Follow category deletion's conflict policy and retain historical references.
    if (await Order.exists({ "items.product": id })) {
      return NextResponse.json(
        {
          message: "Cannot delete a product referenced by orders; deactivate it instead",
        },
        { status: 409 },
      );
    }
    const result = await Product.deleteOne({ _id: id });
    if (result.deletedCount === 0) return notFound();
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: unknown) {
    return productErrorResponse(error);
  }
}
