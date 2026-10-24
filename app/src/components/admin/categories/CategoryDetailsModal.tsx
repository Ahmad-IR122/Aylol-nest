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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-details-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="category-details-title" className="text-xl font-bold text-[#352d2b]">
            {t("تفاصيل التصنيف", "Category Details")}
          </h2>

          <button type="button" onClick={onClose} aria-label={t("إغلاق", "Close")}>
            <X size={21} />
          </button>
        </div>

        <div className="space-y-4">
          {fields.map(([label, value]) => (
            <div key={label} className="border-b border-[#f0e9e5] pb-3">
              <p className="mb-1 text-xs text-[#817571]">{label}</p>
              <p className="text-sm font-medium wrap-break-word text-[#352d2b]">{value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#a97872] px-5 py-3 font-semibold text-white"
        >
          {t("إغلاق", "Close")}
        </button>
      </div>
    </div>
  );
}
