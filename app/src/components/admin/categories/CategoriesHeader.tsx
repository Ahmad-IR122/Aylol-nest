"use client";

import { Plus } from "lucide-react";

type CategoriesHeaderProps = {
  locale: string;
  onAdd: () => void;
};

export default function CategoriesHeader({ locale, onAdd }: CategoriesHeaderProps) {
  const isArabic = locale === "ar";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-[#a97872] dark:text-[#d4a39b]">
          Aylol Nest / Admin
        </p>

        <h1 className="text-3xl font-bold text-[#352d2b] dark:text-[#f5efec]">
          {isArabic ? "إدارة التصنيفات" : "Categories Management"}
        </h1>

        <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">
          {isArabic
            ? "إضافة وتنظيم تصنيفات المنتجات في المتجر."
            : "Create and organize your store categories."}
        </p>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-[#a97872] px-5 py-3 text-sm font-semibold text-white hover:bg-[#93635d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] dark:bg-[#d4a39b] dark:text-[#352d2b] dark:hover:bg-[#e2b8b0] dark:focus-visible:outline-[#d4a39b]"
      >
        <Plus size={18} />
        {isArabic ? "إضافة تصنيف" : "Add Category"}
      </button>
    </div>
  );
}
