"use client";

import { useState } from "react";
import { ZodError } from "zod";
import { productForm, productPayload } from "@/lib/products/form";
import { ProductInputError } from "@/lib/products/validation";
import { productErrorCode } from "@/lib/products/client";
import type { Product, ProductForm, ProductInput, ProductUpdate } from "@/types/product";

export function useProductForm(product?: Product) {
  const [form, setForm] = useState(() => productForm(product));
  const [error, setError] = useState("");
  const [invalidPaths, setInvalidPaths] = useState<string[]>([]);
  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
    setInvalidPaths([]);
  }
  async function submit(save: (payload: ProductInput | ProductUpdate | null) => Promise<void>) {
    setError("");
    setInvalidPaths([]);
    try {
      await save(productPayload(form, product));
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        setInvalidPaths(error.issues.map((issue) => issue.path.join(".")));
        setError("validation");
      } else if (error instanceof ProductInputError) setError("duplicates");
      else setError(productErrorCode(error));
    }
  }
  return { form, update, submit, error, invalidPaths };
}
