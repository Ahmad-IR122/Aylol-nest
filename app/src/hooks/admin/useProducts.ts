"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  productErrorCode,
  productRequest,
  ProductRequestError,
  type ProductErrorCode,
} from "@/lib/products/client";
import type { Category } from "@/types/category";
import type {
  Product,
  ProductFilters,
  ProductInput,
  ProductList,
  ProductUpdate,
} from "@/types/product";

export function useProducts(filters: ProductFilters, onPageOutOfRange: (page: number) => void) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: ProductList;
    error?: ProductErrorCode;
  }>({ key: "" });
  const [categoryResult, setCategoryResult] = useState<{
    categories: Category[];
    loading: boolean;
    error?: ProductErrorCode;
  }>({ categories: [], loading: true });
  const [categoryRevision, setCategoryRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const mutationLock = useRef(false);
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: "12",
    sortBy: filters.sort,
    sortOrder: filters.sort.startsWith("name") ? "asc" : "desc",
  });
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.isActive) params.set("isActive", filters.isActive);
  const query = params.toString();
  const key = `${query}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    productRequest<ProductList>(`/api/admin/products?${query}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          const lastPage = Math.max(1, data.pagination.totalPages);
          if (filters.page > lastPage) onPageOutOfRange(lastPage);
          setResult({ key, data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error: productErrorCode(error) });
      });
    return () => controller.abort();
  }, [query, key, filters.page, onPageOutOfRange]);

  useEffect(() => {
    const controller = new AbortController();
    productRequest<{ categories: Category[] }>("/api/admin/categories", {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted)
          setCategoryResult({ categories: data.categories, loading: false });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setCategoryResult({ categories: [], loading: false, error: productErrorCode(error) });
      });
    return () => controller.abort();
  }, [categoryRevision]);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  function refreshCategories() {
    setCategoryResult((value) => ({ ...value, loading: true, error: undefined }));
    setCategoryRevision((value) => value + 1);
  }
  const getProduct = useCallback(async (id: string, signal?: AbortSignal) => {
    return (await productRequest<{ product: Product }>(`/api/admin/products/${id}`, { signal }))
      .product;
  }, []);

  async function mutate(
    method: "POST" | "PATCH" | "DELETE",
    id?: string,
    payload?: ProductInput | ProductUpdate,
  ) {
    if (mutationLock.current) throw new ProductRequestError("busy");
    mutationLock.current = true;
    setSaving(true);
    try {
      await productRequest(`/api/admin/products${id ? `/${id}` : ""}`, {
        method,
        ...(payload
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
          : {}),
      });
      // A failed list refresh must never turn a successful save into an apparent
      // failure and invite a duplicate creation. Fetch errors have separate state.
      refresh();
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  return {
    data: result.key === key ? result.data : undefined,
    error: result.key === key ? result.error : undefined,
    loading: result.key !== key,
    categories: categoryResult.categories,
    categoriesLoading: categoryResult.loading,
    categoriesError: categoryResult.error,
    refreshCategories,
    saving,
    refresh,
    getProduct,
    mutate,
  };
}
