
"use client";

import { useState } from "react";

import type { CategoryForm } from "@/types/category";

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

  function updateField<K extends keyof CategoryForm>(
    field: K,
    value: CategoryForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openForm() {
    setForm({ ...initialForm });
    setIsOpen(true);
  }

  function closeForm() {
    setIsOpen(false);
  }

  function resetForm() {
    setForm({ ...initialForm });
  }

  return {
    form,
    isOpen,
    updateField,
    openForm,
    closeForm,
    resetForm,
  };
}
