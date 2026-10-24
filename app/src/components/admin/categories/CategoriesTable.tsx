
"use client";

import { FolderTree, RefreshCw } from "lucide-react";

import type { Category } from "@/types/category";

type CategoriesTableProps = {
  categories: Category[];
  locale: string;
  loading: boolean;
  onRefresh: () => void;
};

export default function CategoriesTable({
  categories,
  locale,
  loading,
  onRefresh,
}: CategoriesTableProps) {
  const isArabic = locale === "ar";
  const language = isArabic ? "ar" : "en";

  const t = (ar: string, en: string) => (isArabic ? ar : en);

  return (
    <section className="rounded-2xl border border-[#eee5e0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#eee5e0] p-5">
        <div className="flex items-center gap-3">
          <FolderTree size={22} className="text-[#a97872]" />

          <h2 className="font-semibold text-[#352d2b]">
            {t("قائمة التصنيفات", "Category List")}
          </h2>

          <span className="rounded-full bg-[#faf1ee] px-3 py-1 text-xs font-bold text-[#a97872]">
            {categories.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label={t("تحديث", "Refresh")}
          className="rounded-lg p-2 text-[#817571] hover:bg-[#faf6f3] disabled:opacity-50"
        >
          <RefreshCw
            size={19}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#817571]">
          {t("جاري التحميل...", "Loading categories...")}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <FolderTree size={44} className="text-[#c5a7a0]" />
          <h3 className="font-semibold text-[#352d2b]">
            {t("لا توجد تصنيفات بعد", "No categories yet")}
          </h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead className="bg-[#faf8f6] text-[#817571]">
              <tr>
                <th className="px-5 py-4 text-start">
                  {t("التصنيف", "Category")}
                </th>
                <th className="px-5 py-4 text-start">Slug</th>
                <th className="px-5 py-4 text-start">
                  {t("التصنيف الرئيسي", "Parent")}
                </th>
                <th className="px-5 py-4 text-start">
                  {t("الترتيب", "Order")}
                </th>
                <th className="px-5 py-4 text-start">
                  {t("الحالة", "Status")}
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => {
                const parent = categories.find(
                  (item) => item._id === category.parent,
                );

                return (
                  <tr
                    key={category._id}
                    className="border-t border-[#f0e9e5]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#352d2b]">
                        {category.name[language]}
                      </p>
                      <p className="mt-1 text-xs text-[#817571]">
                        {category.name[isArabic ? "en" : "ar"]}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[#6d625e]">
                      {category.slug}
                    </td>

                    <td className="px-5 py-4 text-[#6d625e]">
                      {parent ? parent.name[language] : "—"}
                    </td>

                    <td className="px-5 py-4">
                      {category.sortOrder}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          category.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.isActive
                          ? t("نشط", "Active")
                          : t("غير نشط", "Inactive")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
