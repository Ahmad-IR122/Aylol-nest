"use client";

import { useLocale, useTranslations } from "next-intl";
import { Eye, Package, Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { availableStock, productPrice } from "@/lib/products/form";
import type { Product, ProductList } from "@/types/product";
import {
  ProductThumbnail,
  mutedClass,
  panelClass,
  primaryClass,
  secondaryClass,
} from "./ProductUi";

export default function ProductsTable({
  data,
  loading,
  disabled,
  filtered,
  page,
  onPage,
  onRefresh,
  onAdd,
  onReset,
  onDetails,
  onEdit,
  onDelete,
  onToggle,
}: {
  data?: ProductList;
  loading: boolean;
  disabled: boolean;
  filtered: boolean;
  page: number;
  onPage: (page: number) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onReset: () => void;
  onDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggle: (product: Product) => void;
}) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  function status(product: Product) {
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${product.isActive ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}
      >
        {t(product.isActive ? "active" : "inactive")}
      </span>
    );
  }
  function actions(product: Product) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {[
          { label: "view", Icon: Eye, action: onDetails },
          { label: "edit", Icon: Pencil, action: onEdit },
          { label: product.isActive ? "deactivate" : "activate", Icon: Power, action: onToggle },
          { label: "delete", Icon: Trash2, action: onDelete },
        ].map(({ label, Icon, action }) => (
          <Button
            type="button"
            key={label}
            variant="ghost"
            disabled={disabled}
            onClick={() => action(product)}
            title={t(label)}
            aria-label={`${t(label)}: ${product.name[language]}`}
            className={`size-11 rounded-xl ${label === "delete" ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40" : "text-[#817571] hover:bg-[#faf1ee] dark:text-[#d4a39b] dark:hover:bg-[#3a3431]"}`}
          >
            <Icon size={18} />
          </Button>
        ))}
      </div>
    );
  }
  function inventory(product: Product) {
    const stock = availableStock(product);
    return (
      <div>
        <p className={stock === 0 ? "text-amber-700 dark:text-amber-300" : ""}>
          {stock ? t("units", { count: stock }) : t("outOfStock")}
        </p>
        <p className={`mt-1 text-xs ${mutedClass}`}>
          {t("variantsCount", { count: product.variants.length })}
        </p>
      </div>
    );
  }
  const totalPages = data?.pagination.totalPages ?? 0;
  const products = data?.products ?? [];
  return (
    <section className={`${panelClass} min-w-0 overflow-hidden shadow-sm`} aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee5e0] px-5 py-4 dark:border-[#3a3431]">
        <div className="flex items-center gap-3">
          <Package size={21} className="text-[#a97872] dark:text-[#d4a39b]" />
          <h2 className="font-semibold">{t("catalog")}</h2>
          <span className={`text-xs ${mutedClass}`}>
            {loading ? "—" : t("count", { count: data?.pagination.total ?? 0 })}
          </span>
        </div>
        <Button
          variant="ghost"
          className="size-11"
          disabled={loading || disabled}
          onClick={onRefresh}
          aria-label={t("refresh")}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
      </div>
      {loading ? (
        <div role="status" className="space-y-5 p-6">
          <span className="sr-only">{t("loading")}</span>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-xl bg-[#f4ede8] dark:bg-[#3a3431]" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-1/2 bg-[#f4ede8] dark:bg-[#3a3431]" />
                <Skeleton className="h-3 w-1/3 bg-[#f4ede8] dark:bg-[#3a3431]" />
              </div>
            </div>
          ))}
        </div>
      ) : !products.length ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="rounded-2xl bg-[#faf1ee] p-4 text-[#a97872] dark:bg-[#3a3431] dark:text-[#d4a39b]">
            <Package size={32} />
          </div>
          <h3 className="mt-2 text-lg font-semibold">{t(filtered ? "noResults" : "emptyTitle")}</h3>
          <p className={`max-w-md text-sm leading-relaxed ${mutedClass}`}>
            {t(filtered ? "noResultsDescription" : "emptyDescription")}
          </p>
          <Button className={`mt-3 ${primaryClass}`} onClick={filtered ? onReset : onAdd}>
            {!filtered && <Plus />}
            {t(filtered ? "reset" : "add")}
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[850px] text-start text-sm">
              <thead className="bg-[#faf8f6] text-xs text-[#817571] dark:bg-[#211e1c] dark:text-[#aaa09b]">
                <tr>
                  {["image", "product", "category", "price", "inventory", "status", "actions"].map(
                    (column) => (
                      <th key={column} scope="col" className="px-4 py-4 text-start font-medium">
                        {t(column)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t border-[#eee5e0] dark:border-[#3a3431]">
                    <td className="px-4 py-4">
                      <ProductThumbnail
                        url={
                          product.images[0]?.url ??
                          product.variants.find((variant) => variant.images.length)?.images[0]?.url
                        }
                        alt={product.name[language]}
                      />
                    </td>
                    <td className="max-w-60 px-4 py-4">
                      <p className="font-semibold wrap-anywhere">{product.name[language]}</p>
                      <p className={`mt-1 text-xs wrap-anywhere ${mutedClass}`}>
                        {product.name[language === "ar" ? "en" : "ar"]}
                      </p>
                    </td>
                    <td className="max-w-36 px-4 py-4 wrap-anywhere">
                      {product.category?.name[language] ?? t("missingCategory")}
                    </td>
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      {productPrice(product, locale)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{inventory(product)}</td>
                    <td className="px-4 py-4">{status(product)}</td>
                    <td className="px-3 py-4">{actions(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-[#eee5e0] lg:hidden dark:divide-[#3a3431]">
            {products.map((product) => (
              <article key={product._id} className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <ProductThumbnail
                    url={
                      product.images[0]?.url ??
                      product.variants.find((variant) => variant.images.length)?.images[0]?.url
                    }
                    alt={product.name[language]}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold wrap-anywhere">{product.name[language]}</h3>
                    <p className={`mt-1 text-sm wrap-anywhere ${mutedClass}`}>
                      {product.category?.name[language] ?? t("missingCategory")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">{productPrice(product, locale)}</p>
                    {inventory(product)}
                  </div>
                  {status(product)}
                </div>
                <div className="flex justify-end">{actions(product)}</div>
              </article>
            ))}
          </div>
        </>
      )}
      {!loading && (totalPages > 1 || page > 1) && (
        <nav
          aria-label={t("catalog")}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5e0] p-4 dark:border-[#3a3431]"
        >
          <p className={`text-sm ${mutedClass}`}>
            {t("page", { page, total: Math.max(page, totalPages, 1) })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={secondaryClass}
              disabled={disabled || page <= 1}
              onClick={() => onPage(page - 1)}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              className={secondaryClass}
              disabled={disabled || page >= totalPages}
              onClick={() => onPage(page + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
