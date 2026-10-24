
"use client";

import { useCallback, useEffect, useState } from "react";

import type { Category, CategoryForm } from "@/types/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to fetch categories");
      }

      setCategories(data.categories ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  async function createCategory(form: CategoryForm): Promise<boolean> {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: {
            ar: form.nameAr,
            en: form.nameEn,
          },
          slug: form.slug,
          description: {
            ar: form.descriptionAr,
            en: form.descriptionEn,
          },
          parent: form.parent || null,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
          imageUrl: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to create category");
      }

      setSuccess("Category created successfully");
      await fetchCategories();

      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create category",
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    categories,
    loading,
    saving,
    error,
    success,
    fetchCategories,
    createCategory,
    clearMessages: () => {
      setError("");
      setSuccess("");
    },
  };
}
