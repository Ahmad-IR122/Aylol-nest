
"use client";

import { useCallback, useEffect, useState } from "react";

import type { Category, CategoryForm } from "@/types/category";

const BASE_URL = "/api/admin/categories";

async function parseResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong";

    throw new Error(message);
  }

  return data as T;
}

function toPayload(form: CategoryForm) {
  return {
    name: {
      ar: form.nameAr.trim(),
      en: form.nameEn.trim(),
    },
    slug: form.slug.trim().toLowerCase(),
    description: {
      ar: form.descriptionAr.trim(),
      en: form.descriptionEn.trim(),
    },
    parent: form.parent || null,
    sortOrder: Number(form.sortOrder),
    isActive: form.isActive,
  };
}

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
      const response = await fetch(BASE_URL, {
        cache: "no-store",
      });

      const data = await parseResponse<{
        categories: Category[];
      }>(response);

      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  async function getCategoryById(id: string) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      cache: "no-store",
    });

    const data = await parseResponse<{
      category: Category;
    }>(response);

    return data.category;
  }

  async function createCategory(form: CategoryForm) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      await parseResponse(response);
      await fetchCategories();

      setSuccess("Category created successfully");
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(id: string, form: CategoryForm) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      await parseResponse(response);
      await fetchCategories();

      setSuccess("Category updated successfully");
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
      });

      await parseResponse(response);
      await fetchCategories();

      setSuccess("Category deleted successfully");
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(category: Category) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${BASE_URL}/${category._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: !category.isActive,
          }),
        },
      );

      await parseResponse(response);
      await fetchCategories();

      setSuccess("Category status updated successfully");
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to change category status",
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
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    clearMessages: () => {
      setError("");
      setSuccess("");
    },
  };
}
