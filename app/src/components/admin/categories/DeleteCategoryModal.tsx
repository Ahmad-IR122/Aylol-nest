
"use client";

import { AlertTriangle, X } from "lucide-react";
import type { Category } from "@/types/category";

type Props = {
  category: Category;
  locale: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteCategoryModal({
  category,
  locale,
  saving,
  error,
  onClose,
  onConfirm,
}: Props) {
  const isArabic = locale === "ar";
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        aria-describedby="delete-category-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="rounded-full bg-red-50 p-3 text-red-600">
            <AlertTriangle size={26} />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label={t("إغلاق", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-category-title"
          className="mt-5 text-xl font-bold text-[#352d2b]"
        >
          {t("حذف التصنيف", "Delete Category")}
        </h2>

        <p
          id="delete-category-description"
          className="mt-3 text-sm leading-7 text-[#817571]"
        >
          {t(
            "هل أنت متأكد من حذف التصنيف",
            "Are you sure you want to delete",
          )}{" "}
          <strong className="text-[#352d2b]">
            {category.name[isArabic ? "ar" : "en"]}
          </strong>
          ؟
        </p>

        <p className="mt-3 text-sm text-red-600">
          {t(
            "لا يمكن التراجع عن الحذف. إذا كان التصنيف يحتوي على منتجات أو تصنيفات فرعية، فلن يسمح النظام بحذفه.",
            "This action cannot be undone. Categories with products or subcategories cannot be deleted.",
          )}
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e8ddd7] px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {t("إلغاء", "Cancel")}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving
              ? t("جاري الحذف...", "Deleting...")
              : t("نعم، احذف", "Yes, Delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
