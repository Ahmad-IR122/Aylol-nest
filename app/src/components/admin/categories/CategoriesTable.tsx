"use client";

import { Eye, Pencil, Trash2, RefreshCw, FolderTree } from "lucide-react";

import type { Category } from "@/types/category";

type Props = {
  categories: Category[];
  locale: string;
  loading: boolean;
  saving: boolean;
  onRefresh: () => void;
  onDetails: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggle: (category: Category) => void;
};

export default function CategoriesTable({
  categories,
  locale,
  loading,
  saving,
  onRefresh,
  onDetails,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const isArabic = locale === "ar";
  const language = isArabic ? "ar" : "en";
  const t = (ar: string, en: string) => (isArabic ? ar : en);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white text-[#352d2b] shadow-sm dark:border-[#3a3431] dark:bg-[#292524] dark:text-[#f5efec]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee5e0] p-5 dark:border-[#3a3431]">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <FolderTree size={22} className="text-[#a97872] dark:text-[#d4a39b]" />
          <h2 className="font-semibold text-[#352d2b] dark:text-[#f5efec]">
            {t("قائمة التصنيفات", "Categories")}
          </h2>
          <span className="rounded-full bg-[#faf1ee] px-3 py-1 text-xs text-[#a97872] dark:bg-[#3a3431] dark:text-[#d4a39b]">
            {categories.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || saving}
          aria-label={t("تحديث", "Refresh")}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 hover:bg-[#faf6f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] disabled:opacity-50 dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <p className="p-12 text-center text-[#817571] dark:text-[#aaa09b]">
          {t("جاري التحميل...", "Loading...")}
        </p>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <FolderTree size={40} className="text-[#c5a7a0] dark:text-[#d4a39b]" />
          <p className="text-[#817571] dark:text-[#aaa09b]">
            {t("لا توجد تصنيفات بعد", "No categories yet")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-[#faf8f6] text-[#817571] dark:bg-[#171717] dark:text-[#aaa09b]">
              <tr>
                <th className="px-5 py-4 text-start">{t("التصنيف", "Category")}</th>
                <th className="px-5 py-4 text-start">Slug</th>
                <th className="px-5 py-4 text-start">{t("التصنيف الرئيسي", "Parent")}</th>
                <th className="px-5 py-4 text-start">{t("الحالة", "Status")}</th>
                <th className="px-5 py-4 text-start">{t("الإجراءات", "Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => {
                const parent = categories.find((item) => item._id === category.parent);

                return (
                  <tr
                    key={category._id}
                    className="border-t border-[#f0e9e5] hover:bg-[#faf8f6] dark:border-[#3a3431] dark:hover:bg-[#3a3431]/50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#352d2b] dark:text-[#f5efec]">
                        {category.name[language]}
                      </p>
                      <p className="mt-1 text-xs text-[#817571] dark:text-[#aaa09b]">
                        {category.name[isArabic ? "en" : "ar"]}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[#6d625e] dark:text-[#aaa09b]">
                      {category.slug}
                    </td>

                    <td className="px-5 py-4">{parent ? parent.name[language] : "—"}</td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onToggle(category)}
                        aria-label={t("تغيير حالة التصنيف", "Change category status")}
                        className={`min-h-11 rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] disabled:opacity-50 dark:focus-visible:outline-[#d4a39b] ${
                          category.isActive
                            ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-200"
                            : "bg-gray-100 text-gray-600 dark:bg-[#3a3431] dark:text-[#aaa09b]"
                        }`}
                      >
                        {category.isActive ? t("نشط", "Active") : t("غير نشط", "Inactive")}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onDetails(category)}
                          disabled={saving}
                          title={t("التفاصيل", "Details")}
                          aria-label={t("التفاصيل", "Details")}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-[#6d625e] hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] dark:text-[#aaa09b] dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(category)}
                          disabled={saving}
                          title={t("تعديل", "Edit")}
                          aria-label={t("تعديل", "Edit")}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-[#a97872] hover:bg-[#faf1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] dark:text-[#d4a39b] dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(category)}
                          disabled={saving}
                          title={t("حذف", "Delete")}
                          aria-label={t("حذف", "Delete")}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] dark:text-red-300 dark:hover:bg-red-950/40 dark:focus-visible:outline-[#d4a39b]"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
