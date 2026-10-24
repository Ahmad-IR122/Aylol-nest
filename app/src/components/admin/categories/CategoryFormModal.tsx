"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

import type { Category, CategoryForm, CategoryMode } from "@/types/category";

type CategoryFormModalProps = {
  locale: string;
  form: CategoryForm;
  categories: Category[];
  mode: CategoryMode;
  editingId: string | null;
  saving: boolean;
  error: string;
  onChange: <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const inputClass =
  "w-full rounded-xl border border-[#e8ddd7] bg-white px-4 py-3 text-sm text-[#352d2b] outline-none transition focus:border-[#a97872] focus:ring-2 focus:ring-[#a97872]/15";

export default function CategoryFormModal({
  locale,
  form,
  categories,
  mode,
  editingId,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const isArabic = locale === "ar";

  const t = (ar: string, en: string) => (isArabic ? ar : en);

  // Exclude the category being edited from parent options.
  const availableParents = categories.filter((category) => category._id !== editingId);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#faf8f6] p-6 shadow-xl"
      >
        {/* Modal Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 id="category-form-title" className="text-xl font-bold text-[#352d2b]">
            {mode === "create"
              ? t("إضافة تصنيف جديد", "Add New Category")
              : t("تعديل التصنيف", "Edit Category")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={t("إغلاق", "Close")}
            className="rounded-lg p-2 text-[#817571] transition hover:bg-white disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </div>

        {/* Category Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Category Names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="block text-sm font-medium text-[#352d2b]">
                {t("الاسم بالعربي", "Arabic Name")} *
              </span>

              <input
                required
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => onChange("nameAr", e.target.value)}
                placeholder="ملابس الأطفال"
                className={inputClass}
              />
            </label>

            <label className="block space-y-2">
              <span className="block text-sm font-medium text-[#352d2b]">
                {t("الاسم بالإنجليزي", "English Name")} *
              </span>

              <input
                required
                dir="ltr"
                value={form.nameEn}
                onChange={(e) => onChange("nameEn", e.target.value)}
                placeholder="Kids Clothing"
                className={inputClass}
              />
            </label>
          </div>

          {/* Slug */}
          <label className="block space-y-2">
            <span className="block text-sm font-medium text-[#352d2b]">Slug *</span>

            <input
              required
              dir="ltr"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="kids-clothing"
              value={form.slug}
              onChange={(e) => onChange("slug", e.target.value.toLowerCase())}
              className={inputClass}
            />

            <span className="block text-xs text-[#817571]">
              {t(
                "معرّف فريد للتصنيف، يُستخدم في رابط الصفحة. مثال: kids-clothing",
                "A unique identifier used in the category URL. Example: kids-clothing",
              )}
            </span>
          </label>

          {/* Descriptions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="block text-sm font-medium text-[#352d2b]">
                {t("الوصف بالعربي", "Arabic Description")}
              </span>

              <textarea
                rows={3}
                dir="rtl"
                value={form.descriptionAr}
                onChange={(e) => onChange("descriptionAr", e.target.value)}
                placeholder="وصف التصنيف بالعربي"
                className={inputClass}
              />
            </label>

            <label className="block space-y-2">
              <span className="block text-sm font-medium text-[#352d2b]">
                {t("الوصف بالإنجليزي", "English Description")}
              </span>

              <textarea
                rows={3}
                dir="ltr"
                value={form.descriptionEn}
                onChange={(e) => onChange("descriptionEn", e.target.value)}
                placeholder="Category description in English"
                className={inputClass}
              />
            </label>
          </div>

          {/* Parent Category & Sort Order */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="block text-sm font-medium text-[#352d2b]">
                {t("التصنيف الرئيسي", "Parent Category")}
              </span>

              <select
                value={form.parent}
                onChange={(e) => onChange("parent", e.target.value)}
                className={inputClass}
              >
                <option value="">{t("بدون تصنيف رئيسي", "No parent category")}</option>

                {availableParents.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name[isArabic ? "ar" : "en"]}
                  </option>
                ))}
              </select>

              <span className="block text-xs text-[#817571]">
                {t(
                  "اتركه فارغًا إذا كان التصنيف رئيسيًا.",
                  "Leave empty if this is a main category.",
                )}
              </span>
            </label>

            <label className="block space-y-2">
              <span className="block text-sm font-medium text-[#352d2b]">
                {t("الترتيب", "Sort Order")}
              </span>

              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={(e) => onChange("sortOrder", e.target.value)}
                className={inputClass}
              />

              <span className="block text-xs text-[#817571]">
                {t("الأرقام الأصغر تظهر أولًا.", "Lower numbers appear first.")}
              </span>
            </label>
          </div>

          {/* Active Status */}
          <label className="flex items-center gap-3 rounded-xl border border-[#e8ddd7] bg-white p-4">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
              className="size-4 accent-[#a97872]"
            />

            <span className="text-sm font-medium text-[#352d2b]">
              {t("تصنيف نشط", "Active Category")}
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-[#eee5e0] pt-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-[#e8ddd7] px-5 py-3 text-sm font-medium text-[#6d625e] transition hover:bg-white disabled:opacity-50"
            >
              {t("إلغاء", "Cancel")}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#a97872] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#93635d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? t("جاري الحفظ...", "Saving...")
                : mode === "create"
                  ? t("إضافة التصنيف", "Create Category")
                  : t("حفظ التعديلات", "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
