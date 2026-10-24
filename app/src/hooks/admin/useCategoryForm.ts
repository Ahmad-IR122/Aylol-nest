
"use client";

import { useState } from "react";

import type {
  Category,
  CategoryForm,
  CategoryMode,
} from "@/types/category";

const initialForm: CategoryForm = {
  nameAr: "",
  nameEn: "",
  slug: "",
  descriptionAr: "",
  descriptionEn: "",
  parent: "",
  sortOrder: "0",
  isActive: true,
};

export function useCategoryForm() {
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<CategoryMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  function updateField<K extends keyof CategoryForm>(
    field: K,
    value: CategoryForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openCreate() {
    setForm({ ...initialForm });
    setMode("create");
    setEditingId(null);
    setIsOpen(true);
  }

  function openEdit(category: Category) {
    setForm({
      nameAr: category.name.ar,
      nameEn: category.name.en,
      slug: category.slug,
      descriptionAr: category.description?.ar ?? "",
      descriptionEn: category.description?.en ?? "",
      parent: category.parent ?? "",
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });

    setMode("edit");
    setEditingId(category._id);
    setIsOpen(true);
  }

  function closeForm() {
    setIsOpen(false);
  }

  return {
    form,
    isOpen,
    mode,
    editingId,
    updateField,
    openCreate,
    openEdit,
    closeForm,
  };
}
