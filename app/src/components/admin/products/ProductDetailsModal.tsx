"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { availableStock, productPrice } from "@/lib/products/form";
import type { Product } from "@/types/product";
import { ProductModal, ProductThumbnail, mutedClass, secondaryClass } from "./ProductUi";

export default function ProductDetailsModal({
  product,
  onClose,
  onEdit,
}: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "ILS" });
  function date(value: string) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "—"
      : new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Hebron",
        }).format(parsed);
  }
  const fields = [
    ["nameAr", product.name.ar],
    ["nameEn", product.name.en],
    ["descriptionAr", product.description?.ar || "—"],
    ["descriptionEn", product.description?.en || "—"],
    ["slug", product.slug],
    ["category", product.category?.name[language] ?? t("missingCategory")],
    ["price", productPrice(product, locale)],
    ["inventory", new Intl.NumberFormat(locale).format(availableStock(product))],
    ["status", t(product.isActive ? "active" : "inactive")],
    ["gender", t(product.gender)],
    ["ageGroup", t(product.ageGroup)],
    ["createdAt", date(product.createdAt)],
    ["updatedAt", date(product.updatedAt)],
  ];
  return (
    <ProductModal
      title={t("detailsTitle")}
      description={product.name[language]}
      onClose={onClose}
      wide
    >
      <section aria-label={t("gallery")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {product.images.length ? (
          product.images.map((image, index) => (
            <ProductThumbnail
              key={`${image.publicId}-${index}`}
              url={image.url}
              alt={image.alt?.[language] || product.name[language]}
              large
            />
          ))
        ) : (
          <ProductThumbnail alt={product.name[language]} large />
        )}
      </section>
      <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0 border-b border-[#eee5e0] pb-3 dark:border-[#3a3431]">
            <dt className={`mb-1 text-xs ${mutedClass}`}>{t(label)}</dt>
            <dd
              dir={
                label.endsWith("Ar")
                  ? "rtl"
                  : label.endsWith("En") || label === "slug"
                    ? "ltr"
                    : undefined
              }
              className="text-sm wrap-anywhere whitespace-pre-wrap"
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <section className="space-y-3">
        <h3 className="font-semibold">{t("variants")}</h3>
        {product.variants.map((variant) => (
          <div
            key={variant._id}
            className="rounded-xl border border-[#eee5e0] p-4 dark:border-[#3a3431]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-medium wrap-anywhere">
                {variant.size} · {variant.color.name[language]}
              </h4>
              <span className={`text-xs ${mutedClass}`}>
                {t(variant.isActive ? "active" : "inactive")}
              </span>
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["sku", variant.sku],
                ["stock", new Intl.NumberFormat(locale).format(variant.stock)],
                ["price", money.format(variant.price)],
                ["colorAr", variant.color.name.ar],
                ["colorEn", variant.color.name.en],
                ["hex", variant.color.hex],
                ...(variant.compareAtPrice !== null
                  ? [["compareAtPrice", money.format(variant.compareAtPrice)]]
                  : []),
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className={`text-xs ${mutedClass}`}>{t(label)}</dt>
                  <dd className="mt-1 wrap-anywhere">{value}</dd>
                </div>
              ))}
            </dl>
            {variant.images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {variant.images.map((image, index) => (
                  <ProductThumbnail
                    key={index}
                    url={image.url}
                    alt={image.alt?.[language] || product.name[language]}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
      <div className="flex justify-end gap-3">
        <Button variant="outline" className={secondaryClass} onClick={onClose}>
          {t("close")}
        </Button>
        <Button variant="outline" className={secondaryClass} onClick={onEdit}>
          {t("edit")}
        </Button>
      </div>
    </ProductModal>
  );
}
