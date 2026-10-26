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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 text-[#352d2b] dark:bg-black/65 dark:text-[#f5efec]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        aria-describedby="delete-category-description"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-[#292524]"
      >
        <div className="flex items-start justify-between">
          <div className="rounded-full bg-red-50 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={26} />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label={t("إغلاق", "Close")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#817571] hover:bg-[#faf8f6] focus-visible:outline-2 focus-visible:outline-[#a97872] dark:text-[#aaa09b] dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-category-title"
          className="mt-5 text-xl font-bold text-[#352d2b] dark:text-[#f5efec]"
        >
          {t("حذف التصنيف", "Delete Category")}
        </h2>

        <p
          id="delete-category-description"
          className="mt-3 text-sm leading-7 text-[#817571] dark:text-[#aaa09b]"
        >
          {t("هل أنت متأكد من حذف التصنيف", "Are you sure you want to delete")}{" "}
          <strong className="text-[#352d2b] dark:text-[#f5efec]">
            {category.name[isArabic ? "ar" : "en"]}
          </strong>
          ؟
        </p>

        <p className="mt-3 text-sm text-red-600 dark:text-red-300">
          {t(
            "لا يمكن التراجع عن الحذف. إذا كان التصنيف يحتوي على منتجات أو تصنيفات فرعية، فلن يسمح النظام بحذفه.",
            "This action cannot be undone. Categories with products or subcategories cannot be deleted.",
          )}
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e8ddd7] px-4 py-3 text-sm font-semibold hover:bg-[#faf8f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] disabled:opacity-50 dark:border-[#3a3431] dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]"
          >
            {t("إلغاء", "Cancel")}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] disabled:opacity-50 dark:focus-visible:outline-[#d4a39b]"
          >
            {saving ? t("جاري الحذف...", "Deleting...") : t("نعم، احذف", "Yes, Delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
