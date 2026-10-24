
"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

import type { Category, CategoryForm } from "@/types/category";

type CategoryFormModalProps = {
  locale: string;
  form: CategoryForm;
  categories: Category[];
  saving: boolean;
  error: string;
  onChange: <K extends keyof CategoryForm>(
    field: K,
    value: CategoryForm[K],
  ) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const inputClass =
  "w-full rounded-xl border border-[#e8ddd7] bg-white px-4 py-3 text-sm text-[#352d2b] outline-none focus:border-[#a97872] focus:ring-2 focus:ring-[#a97872]/15";

export default function CategoryFormModal({
  locale,
  form,
  categories,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const isArabic = locale === "ar";
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#faf8f6] p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="category-form-title"
            className="text-xl font-bold text-[#352d2b]"
          >
            {t("إضافة تصنيف جديد", "Add New Category")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={t("إغلاق", "Close")}
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-medium">
                {t("الاسم بالعربي", "Arabic Name")} *
              </span>
              <input
                required
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => onChange("nameAr", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium">
                {t("الاسم بالإنجليزي", "English Name")} *
              </span>
              <input
                required
                dir="ltr"
                value={form.nameEn}
                onChange={(e) => onChange("nameEn", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Slug *</span>
            <input
              required
              dir="ltr"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="boys-clothing"
              value={form.slug}
              onChange={(e) =>
                onChange("slug", e.target.value.toLowerCase())
              }
              className={inputClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-medium">
                {t("الوصف بالعربي", "Arabic Description")}
              </span>
              <textarea
                rows={3}
                dir="rtl"
                value={form.descriptionAr}
                onChange={(e) =>
                  onChange("descriptionAr", e.target.value)
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium">
                {t("الوصف بالإنجليزي", "English Description")}
              </span>
              <textarea
                rows={3}
                dir="ltr"
                value={form.descriptionEn}
                onChange={(e) =>
                  onChange("descriptionEn", e.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-medium">
                {t("التصنيف الرئيسي", "Parent Category")}
              </span>

              <select
                value={form.parent}
                onChange={(e) => onChange("parent", e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {t("بدون تصنيف رئيسي", "No parent category")}
                </option>

                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name[isArabic ? "ar" : "en"]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium">
                {t("الترتيب", "Sort Order")}
              </span>

              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={(e) =>
                  onChange("sortOrder", e.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                onChange("isActive", e.target.checked)
              }
              className="size-4 accent-[#a97872]"
            />
            <span className="text-sm font-medium">
              {t("تصنيف نشط", "Active Category")}
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[#eee5e0] pt-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-[#e8ddd7] px-5 py-3 text-sm"
            >
              {t("إلغاء", "Cancel")}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#a97872] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? t("جاري الحفظ...", "Saving...")
                : t("حفظ التصنيف", "Save Category")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
