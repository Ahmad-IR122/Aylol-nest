"use client";

import { useCallback, useEffect, useState } from "react";

import type { Category, CategoryForm } from "@/types/category";

const BASE_URL = "/api/admin/categories";

type CategoriesResponse = {
  categories: Category[];
};

type CategoryResponse = {
  category: Category;
};

async function parseResponse<T = unknown>(response: Response): Promise<T> {
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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

async function requestCategories(signal?: AbortSignal) {
  const response = await fetch(BASE_URL, {
    cache: "no-store",
    signal,
  });

  const data = await parseResponse<CategoriesResponse>(response);

  return data.categories;
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
      const data = await requestCategories();
      setCategories(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialCategories() {
      try {
        const data = await requestCategories(controller.signal);

        if (!controller.signal.aborted) {
          setCategories(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err, "Failed to load categories"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInitialCategories();

    return () => {
      controller.abort();
    };
  }, []);

  const getCategoryById = useCallback(async (id: string) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      cache: "no-store",
    });

    const data = await parseResponse<CategoryResponse>(response);

    return data.category;
  }, []);

  async function runMutation(
    request: () => Promise<Response>,
    successMessage: string,
    fallbackError: string,
  ): Promise<boolean> {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await request();

      await parseResponse(response);

      const updatedCategories = await requestCategories();
      setCategories(updatedCategories);

      setSuccess(successMessage);

      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallbackError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function createCategory(form: CategoryForm) {
    return runMutation(
      () =>
        fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(toPayload(form)),
        }),
      "Category created successfully",
      "Failed to create category",
    );
  }

  async function updateCategory(id: string, form: CategoryForm) {
    return runMutation(
      () =>
        fetch(`${BASE_URL}/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(toPayload(form)),
        }),
      "Category updated successfully",
      "Failed to update category",
    );
  }

  async function deleteCategory(id: string) {
    return runMutation(
      () =>
        fetch(`${BASE_URL}/${id}`, {
          method: "DELETE",
        }),
      "Category deleted successfully",
      "Failed to delete category",
    );
  }

  async function toggleCategory(category: Category) {
    return runMutation(
      () =>
        fetch(`${BASE_URL}/${category._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !category.isActive,
          }),
        }),
      "Category status updated successfully",
      "Failed to change category status",
    );
  }

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

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
    clearMessages,
  };
}
