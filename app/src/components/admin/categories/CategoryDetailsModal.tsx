"use client";

import { X } from "lucide-react";
import type { Category } from "@/types/category";

type Props = {
  category: Category;
  categories: Category[];
  locale: string;
  onClose: () => void;
};

export default function CategoryDetailsModal({ category, categories, locale, onClose }: Props) {
  const isArabic = locale === "ar";
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  const parent = categories.find((item) => item._id === category.parent);

  const fields = [
    [t("الاسم بالعربي", "Arabic Name"), category.name.ar],
    [t("الاسم بالإنجليزي", "English Name"), category.name.en],
    ["Slug", category.slug],
    [t("الوصف بالعربي", "Arabic Description"), category.description?.ar || "—"],
    [t("الوصف بالإنجليزي", "English Description"), category.description?.en || "—"],
    [
      t("التصنيف الرئيسي", "Parent Category"),
      parent ? parent.name[isArabic ? "ar" : "en"] : t("تصنيف رئيسي", "Main Category"),
    ],
    [t("الترتيب", "Sort Order"), String(category.sortOrder)],
    [t("الحالة", "Status"), category.isActive ? t("نشط", "Active") : t("غير نشط", "Inactive")],
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 text-[#352d2b] dark:bg-black/65 dark:text-[#f5efec]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-details-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-[#292524]"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="category-details-title"
            className="text-xl font-bold text-[#352d2b] dark:text-[#f5efec]"
          >
            {t("تفاصيل التصنيف", "Category Details")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("إغلاق", "Close")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#817571] hover:bg-[#faf8f6] focus-visible:outline-2 focus-visible:outline-[#a97872] dark:text-[#aaa09b] dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]"
          >
            <X size={21} />
          </button>
        </div>

        <div className="space-y-4">
          {fields.map(([label, value]) => (
            <div key={label} className="border-b border-[#f0e9e5] pb-3 dark:border-[#3a3431]">
              <p className="mb-1 text-xs text-[#817571] dark:text-[#aaa09b]">{label}</p>
              <p className="text-sm font-medium wrap-anywhere text-[#352d2b] dark:text-[#f5efec]">
                {value}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#a97872] px-5 py-3 font-semibold text-white hover:bg-[#93635d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] dark:bg-[#d4a39b] dark:text-[#352d2b] dark:hover:bg-[#e2b8b0] dark:focus-visible:outline-[#d4a39b]"
        >
          {t("إغلاق", "Close")}
        </button>
      </div>
    </div>
  );
}
