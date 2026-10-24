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
    <section className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#eee5e0] p-5">
        <div className="flex items-center gap-3">
          <FolderTree size={22} className="text-[#a97872]" />
          <h2 className="font-semibold text-[#352d2b]">{t("قائمة التصنيفات", "Categories")}</h2>
          <span className="rounded-full bg-[#faf1ee] px-3 py-1 text-xs text-[#a97872]">
            {categories.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || saving}
          aria-label={t("تحديث", "Refresh")}
          className="rounded-lg p-2 hover:bg-[#faf6f3] disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <p className="p-12 text-center text-[#817571]">{t("جاري التحميل...", "Loading...")}</p>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <FolderTree size={40} className="text-[#c5a7a0]" />
          <p className="text-[#817571]">{t("لا توجد تصنيفات بعد", "No categories yet")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-850px w-full text-sm">
            <thead className="bg-[#faf8f6] text-[#817571]">
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
                  <tr key={category._id} className="border-t border-[#f0e9e5]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#352d2b]">{category.name[language]}</p>
                      <p className="mt-1 text-xs text-[#817571]">
                        {category.name[isArabic ? "en" : "ar"]}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[#6d625e]">{category.slug}</td>

                    <td className="px-5 py-4">{parent ? parent.name[language] : "—"}</td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onToggle(category)}
                        aria-label={t("تغيير حالة التصنيف", "Change category status")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                          category.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
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
                          className="rounded-lg p-2 text-[#6d625e] hover:bg-gray-100"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(category)}
                          disabled={saving}
                          title={t("تعديل", "Edit")}
                          aria-label={t("تعديل", "Edit")}
                          className="rounded-lg p-2 text-[#a97872] hover:bg-[#faf1ee]"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(category)}
                          disabled={saving}
                          title={t("حذف", "Delete")}
                          aria-label={t("حذف", "Delete")}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
