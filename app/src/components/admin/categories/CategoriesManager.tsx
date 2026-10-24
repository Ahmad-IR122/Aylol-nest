
"use client";

import type { FormEvent } from "react";

import { useCategories } from "@/hooks/admin/useCategories";
import { useCategoryForm } from "@/hooks/admin/useCategoryForm";

import CategoriesHeader from "./CategoriesHeader";
import CategoriesTable from "./CategoriesTable";
import CategoryFormModal from "./CategoryFormModal";

import type { CategoryManagerProps } from "@/types/category";

export default function CategoriesManager({
  locale,
}: CategoryManagerProps) {
  const {
    categories,
    loading,
    saving,
    error,
    success,
    fetchCategories,
    createCategory,
    clearMessages,
  } = useCategories();

  const {
    form,
    isOpen,
    updateField,
    openForm,
    closeForm,
    resetForm,
  } = useCategoryForm();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const created = await createCategory(form);

    if (created) {
      resetForm();
      closeForm();
    }
  }

  function handleAdd() {
    clearMessages();
    openForm();
  }

  return (
    <main className="min-h-screen bg-[#faf8f6] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <CategoriesHeader locale={locale} onAdd={handleAdd} />

        {error && !isOpen && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {locale === "ar"
              ? "تمت إضافة التصنيف بنجاح"
              : success}
          </div>
        )}

        <CategoriesTable
          categories={categories}
          locale={locale}
          loading={loading}
          onRefresh={() => void fetchCategories()}
        />
      </div>

      {isOpen && (
        <CategoryFormModal
          locale={locale}
          form={form}
          categories={categories}
          saving={saving}
          error={error}
          onChange={updateField}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
