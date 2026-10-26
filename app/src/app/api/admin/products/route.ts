import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { productErrorResponse } from "@/lib/products/errors";
import {
  createProductSchema,
  escapeProductSearch,
  parseProductQuery,
  ProductInputError,
  readProductBody,
  validateVariantIdentities,
} from "@/lib/products/validation";
import { Category } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // requireAdmin also connects through the existing connectDB utility.
    await requireAdmin();
    const query = parseProductQuery(request.nextUrl.searchParams);
    const filter: mongoose.QueryFilter<IProduct> = {};
    if (query.category) filter.category = new mongoose.Types.ObjectId(query.category);
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
    if (query.search) {
      const search = { $regex: escapeProductSearch(query.search), $options: "i" };
      filter.$or = [{ "name.ar": search }, { "name.en": search }];
    }
    const direction = query.sortOrder === "asc" ? 1 : -1;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [query.sortBy]: direction, _id: direction })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate({ path: "category", model: Category, select: "name slug" })
        .lean(),
      Product.countDocuments(filter),
    ]);
    return NextResponse.json({
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error: unknown) {
    return productErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const input = createProductSchema.parse(await readProductBody(request));
    validateVariantIdentities(input.variants);
    if (!(await Category.exists({ _id: input.category }))) {
      throw new ProductInputError("Category not found");
    }
    if (await Product.exists({ slug: input.slug })) {
      return NextResponse.json({ message: "Product slug already exists" }, { status: 409 });
    }
    const product = await Product.create(input);
    await product.populate({ path: "category", model: Category, select: "name slug" });
    return NextResponse.json({ message: "Product created successfully", product }, { status: 201 });
  } catch (error: unknown) {
    return productErrorResponse(error);
  }
}
