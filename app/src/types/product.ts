import type { z } from "zod";
import type { createProductSchema, updateProductSchema } from "@/lib/products/validation";
import type { Category, LocalizedText } from "./category";

export type ProductInput = z.output<typeof createProductSchema>;
export type ProductUpdate = z.output<typeof updateProductSchema>;
export type ProductImage = NonNullable<ProductInput["images"]>[number];
export type ProductVariant = Required<ProductInput["variants"][number]> & { _id: string };
export type Product = Omit<Required<ProductInput>, "category" | "variants"> & {
  _id: string;
  category: Pick<Category, "_id" | "name" | "slug"> | null;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
};
export type VariantDraft = Omit<ProductVariant, "_id"> & { _id?: string; key: string };
export type ProductForm = Omit<Required<ProductInput>, "variants" | "description"> & {
  description: LocalizedText;
  variants: VariantDraft[];
};
export type ProductList = {
  products: Product[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
export type ProductFilters = {
  search: string;
  category: string;
  isActive: string;
  sort: string;
  page: number;
};
