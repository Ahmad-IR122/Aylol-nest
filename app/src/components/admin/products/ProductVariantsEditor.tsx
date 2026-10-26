"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newVariant } from "@/lib/products/form";
import type { VariantDraft } from "@/types/product";
import ProductImagesManager from "./ProductImagesManager";
import { ProductCheck, ProductField, mutedClass, secondaryClass } from "./ProductUi";

export default function ProductVariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantDraft[];
  onChange: (value: VariantDraft[]) => void;
}) {
  const t = useTranslations("Products");
  const total = variants.reduce(
    (sum, item) => sum + (Number.isFinite(item.stock) ? item.stock : 0),
    0,
  );
  const available = variants
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + (Number.isFinite(item.stock) ? item.stock : 0), 0);
  function update(index: number, changes: Partial<VariantDraft>) {
    onChange(
      variants.map((variant, position) =>
        position === index ? { ...variant, ...changes } : variant,
      ),
    );
  }
  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${mutedClass}`}>
        <span>{t("totalStock", { count: total })}</span>
        <span>{t("availableStock", { count: available })}</span>
      </div>
      {variants.map((variant, index) => (
        <fieldset
          key={variant.key}
          className="min-w-0 rounded-xl border border-[#eee5e0] p-4 dark:border-[#3a3431]"
        >
          <legend className="px-2 text-sm font-semibold">
            {t("variant", { number: index + 1 })}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProductField
              label={t("sku")}
              name={`variants.${index}.sku`}
              required
              dir="ltr"
              value={variant.sku}
              onChange={(event) => update(index, { sku: event.target.value })}
            />
            <ProductField
              label={t("size")}
              name={`variants.${index}.size`}
              required
              value={variant.size}
              onChange={(event) => update(index, { size: event.target.value })}
            />
            <ProductField
              label={t("hex")}
              name={`variants.${index}.color.hex`}
              required
              dir="ltr"
              placeholder="#EEDDBB"
              value={variant.color.hex}
              onChange={(event) =>
                update(index, { color: { ...variant.color, hex: event.target.value } })
              }
            />
            {(["ar", "en"] as const).map((language) => (
              <ProductField
                key={language}
                label={t(language === "ar" ? "colorAr" : "colorEn")}
                name={`variants.${index}.color.name.${language}`}
                required
                dir={language === "ar" ? "rtl" : "ltr"}
                value={variant.color.name[language]}
                onChange={(event) =>
                  update(index, {
                    color: {
                      ...variant.color,
                      name: { ...variant.color.name, [language]: event.target.value },
                    },
                  })
                }
              />
            ))}
            <ProductField
              label={t("stock")}
              name={`variants.${index}.stock`}
              type="number"
              required
              min={0}
              step={1}
              max={Number.MAX_SAFE_INTEGER}
              value={Number.isFinite(variant.stock) ? variant.stock : ""}
              onChange={(event) => update(index, { stock: event.target.valueAsNumber })}
            />
            <ProductField
              label={t("price")}
              name={`variants.${index}.price`}
              type="number"
              required
              min={0}
              step="any"
              value={Number.isFinite(variant.price) ? variant.price : ""}
              onChange={(event) => update(index, { price: event.target.valueAsNumber })}
            />
            <ProductField
              label={t("compareAtPrice")}
              name={`variants.${index}.compareAtPrice`}
              type="number"
              min={0}
              step="any"
              value={variant.compareAtPrice ?? ""}
              onChange={(event) =>
                update(index, {
                  compareAtPrice: event.target.value === "" ? null : event.target.valueAsNumber,
                })
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ProductCheck
              label={t("variantActive")}
              checked={variant.isActive}
              onChange={(value) => update(index, { isActive: value })}
            />
            {!variant._id && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 text-red-600 dark:text-red-300"
                disabled={variants.length === 1}
                onClick={() => onChange(variants.filter((_, position) => position !== index))}
              >
                <Trash2 />
                {t("removeVariant")}
              </Button>
            )}
          </div>
          {variant._id && (
            <p className={`mt-1 text-xs leading-relaxed ${mutedClass}`}>{t("retireHint")}</p>
          )}
          <details
            className="mt-4 border-t border-[#eee5e0] pt-3 dark:border-[#3a3431]"
            open={undefined}
          >
            <summary className="cursor-pointer py-2 text-sm font-medium">
              {t("variantImages")} ({variant.images.length})
            </summary>
            <div className="mt-3">
              <ProductImagesManager
                images={variant.images}
                onChange={(images) => update(index, { images })}
                prefix={`variants.${index}.images`}
              />
            </div>
          </details>
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        className={secondaryClass}
        onClick={() => onChange([...variants, newVariant(crypto.randomUUID())])}
      >
        <Plus />
        {t("addVariant")}
      </Button>
    </div>
  );
}
