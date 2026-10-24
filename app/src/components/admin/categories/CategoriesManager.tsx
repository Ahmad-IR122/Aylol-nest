"use client";

import { useState, type FormEvent } from "react";

import { useCategories } from "@/hooks/admin/useCategories";
import { useCategoryForm } from "@/hooks/admin/useCategoryForm";

import CategoriesHeader from "./CategoriesHeader";
import CategoriesTable from "./CategoriesTable";
import CategoryFormModal from "./CategoryFormModal";
import CategoryDetailsModal from "./CategoryDetailsModal";
import DeleteCategoryModal from "./DeleteCategoryModal";

import type { Category, CategoryManagerProps } from "@/types/category";

export default function CategoriesManager({ locale }: CategoryManagerProps) {
  const {
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
  } = useCategories();

  const { form, isOpen, mode, editingId, updateField, openCreate, openEdit, closeForm } =
    useCategoryForm();

  const [detailsCategory, setDetailsCategory] = useState<Category | null>(null);

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const succeeded =
      mode === "create"
        ? await createCategory(form)
        : editingId
          ? await updateCategory(editingId, form)
          : false;

    if (succeeded) {
      closeForm();
    }
  }

  function handleAdd() {
    clearMessages();
    openCreate();
  }

  function handleEdit(category: Category) {
    clearMessages();
    openEdit(category);
  }

  async function handleDetails(category: Category) {
    setDetailsLoading(true);
    setDetailsError("");
    clearMessages();

    try {
      const details = await getCategoryById(category._id);
      setDetailsCategory(details);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load category details");
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleDelete(category: Category) {
    clearMessages();
    setDeletingCategory(category);
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return;

    const succeeded = await deleteCategory(deletingCategory._id);

    if (succeeded) {
      setDeletingCategory(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f6] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <CategoriesHeader locale={locale} onAdd={handleAdd} />

        {error && !isOpen && !deletingCategory && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {detailsError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {detailsError}
          </div>
        )}

        {detailsLoading && (
          <p className="text-sm text-[#817571]">
            {locale === "ar" ? "جاري تحميل التفاصيل..." : "Loading details..."}
          </p>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <CategoriesTable
          categories={categories}
          locale={locale}
          loading={loading}
          saving={saving}
          onRefresh={() => void fetchCategories()}
          onDetails={(category) => void handleDetails(category)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={(category) => void toggleCategory(category)}
        />
      </div>

      {isOpen && (
        <CategoryFormModal
          locale={locale}
          form={form}
          categories={categories}
          mode={mode}
          editingId={editingId}
          saving={saving}
          error={error}
          onChange={updateField}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {detailsCategory && (
        <CategoryDetailsModal
          locale={locale}
          category={detailsCategory}
          categories={categories}
          onClose={() => setDetailsCategory(null)}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryModal
          locale={locale}
          category={deletingCategory}
          saving={saving}
          error={error}
          onClose={() => setDeletingCategory(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </main>
  );
}
