"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductForm } from "@/hooks/admin/useProductForm";
import {
  ProductUploadContext,
  useProductUploadCoordinator,
} from "@/hooks/admin/useProductImageUploads";
import type { Category } from "@/types/category";
import type { Product, ProductInput, ProductUpdate } from "@/types/product";
import type { ProductErrorCode } from "@/lib/products/client";
import ProductImagesManager from "./ProductImagesManager";
import ProductVariantsEditor from "./ProductVariantsEditor";
import {
  ProductCheck,
  ProductField,
  ProductModal,
  ProductNotice,
  ProductSelect,
  ValidationContext,
  mutedClass,
  primaryClass,
  secondaryClass,
} from "./ProductUi";

export default function ProductFormModal({
  product,
  categories,
  categoriesLoading,
  categoriesError,
  onRefreshCategories,
  saving,
  onSave,
  onClose,
}: {
  product?: Product;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError?: ProductErrorCode;
  onRefreshCategories: () => void;
  saving: boolean;
  onSave: (payload: ProductInput | ProductUpdate | null) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const { form, update, submit, error, invalidPaths } = useProductForm(product);
  const uploads = useProductUploadCoordinator();
  const busy = saving || uploads.state.uploading;
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error, invalidPaths]);
  function fieldLabel(path: string) {
    const labels: Record<string, string> = {
      "name.ar": "nameAr",
      "name.en": "nameEn",
      "description.ar": "descriptionAr",
      "description.en": "descriptionEn",
      "color.name.ar": "colorAr",
      "color.name.en": "colorEn",
      "color.hex": "hex",
      sku: "sku",
      size: "size",
      stock: "stock",
      price: "price",
      compareAtPrice: "compareAtPrice",
      category: "category",
      slug: "slug",
      sortOrder: "sortOrder",
      gender: "gender",
      ageGroup: "ageGroup",
    };
    const match = path.match(/^variants\.(\d+)\.(.*)$/);
    const field = match ? match[2] : path;
    const label = field.includes("images") ? t("images") : t(labels[field] ?? "field");
    return match ? t("variantField", { number: Number(match[1]) + 1, field: label }) : label;
  }
  return (
    <ProductModal
      title={t(product ? "editTitle" : "add")}
      description={t("requiredHint")}
      onClose={onClose}
      busy={busy}
      wide
    >
      <ProductUploadContext value={uploads.context}>
        <ValidationContext value={invalidPaths}>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy && !uploads.isPending()) void submit(onSave);
            }}
            className="space-y-7"
          >
            {error && (
              <div ref={errorRef} tabIndex={-1} className="rounded-xl outline-none">
                <ProductNotice>
                  <p>{t(`errors.${error}`)}</p>
                  {invalidPaths.length > 0 && (
                    <ul className="mt-2 list-inside list-disc">
                      {[...new Set(invalidPaths.map(fieldLabel))].map((field) => (
                        <li key={field}>{t("validationField", { field })}</li>
                      ))}
                    </ul>
                  )}
                </ProductNotice>
              </div>
            )}
            <fieldset disabled={busy} className="min-w-0 space-y-7 disabled:opacity-70">
              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold">{t("basic")}</h3>
                  <p className={`mt-1 text-sm ${mutedClass}`}>{t("basicHint")}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["ar", "en"] as const).map((lang) => (
                    <ProductField
                      key={lang}
                      label={t(lang === "ar" ? "nameAr" : "nameEn")}
                      name={`name.${lang}`}
                      required
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      value={form.name[lang]}
                      onChange={(event) =>
                        update("name", { ...form.name, [lang]: event.target.value })
                      }
                    />
                  ))}
                  <ProductField
                    label={t("slug")}
                    name="slug"
                    required
                    dir="ltr"
                    value={form.slug}
                    hint={t("slugHint")}
                    onChange={(event) => update("slug", event.target.value.toLowerCase())}
                  />
                  <ProductSelect
                    label={t("category")}
                    name="category"
                    required
                    value={form.category}
                    disabled={categoriesLoading}
                    onChange={(value) => update("category", value)}
                  >
                    <option value="">
                      {t(categoriesLoading ? "categoriesLoading" : "chooseCategory")}
                    </option>
                    {product?.category &&
                      !categories.some((item) => item._id === product.category?._id) && (
                        <option value={product.category._id}>
                          {product.category.name[language]}
                        </option>
                      )}
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name[language]}
                        {category.isActive ? "" : ` (${t("inactive")})`}
                      </option>
                    ))}
                  </ProductSelect>
                </div>
                {categoriesError && (
                  <ProductNotice>
                    {t(`errors.${categoriesError}`)}{" "}
                    <Button type="button" variant="link" onClick={onRefreshCategories}>
                      {t("retry")}
                    </Button>
                  </ProductNotice>
                )}
                {!categoriesLoading && !categoriesError && !categories.length && (
                  <p className={`text-sm ${mutedClass}`}>
                    {t("noCategories")}{" "}
                    <Link className="underline" href={`/${locale}/admin/categories`}>
                      {t("manageCategories")}
                    </Link>
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["ar", "en"] as const).map((lang) => (
                    <ProductField
                      key={lang}
                      label={t(lang === "ar" ? "descriptionAr" : "descriptionEn")}
                      name={`description.${lang}`}
                      multiline
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      value={form.description[lang]}
                      onTextChange={(value) =>
                        update("description", { ...form.description, [lang]: value })
                      }
                    />
                  ))}
                  <ProductSelect
                    label={t("gender")}
                    name="gender"
                    value={form.gender}
                    onChange={(value) => update("gender", value as typeof form.gender)}
                  >
                    {["boys", "girls", "unisex"].map((value) => (
                      <option key={value} value={value}>
                        {t(value)}
                      </option>
                    ))}
                  </ProductSelect>
                  <ProductSelect
                    label={t("ageGroup")}
                    name="ageGroup"
                    value={form.ageGroup}
                    onChange={(value) => update("ageGroup", value as typeof form.ageGroup)}
                  >
                    {["newborn", "baby", "toddler", "kids"].map((value) => (
                      <option key={value} value={value}>
                        {t(value)}
                      </option>
                    ))}
                  </ProductSelect>
                </div>
              </section>
              <section className="space-y-4 border-t border-[#eee5e0] pt-6 dark:border-[#3a3431]">
                <div>
                  <h3 className="font-semibold">{t("images")}</h3>
                  <p className={`mt-1 text-sm leading-relaxed ${mutedClass}`}>{t("imagesHint")}</p>
                </div>
                <ProductImagesManager
                  images={form.images}
                  onChange={(images) => update("images", images)}
                />
              </section>
              <section className="space-y-4 border-t border-[#eee5e0] pt-6 dark:border-[#3a3431]">
                <div>
                  <h3 className="font-semibold">{t("variants")}</h3>
                  <p className={`mt-1 text-sm ${mutedClass}`}>{t("variantsHint")}</p>
                </div>
                <ProductVariantsEditor
                  variants={form.variants}
                  onChange={(variants) => update("variants", variants)}
                />
              </section>
              <section className="space-y-4 border-t border-[#eee5e0] pt-6 dark:border-[#3a3431]">
                <h3 className="font-semibold">{t("publishing")}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["isActive", "isFeatured", "isNewArrival"] as const).map((key) => (
                    <ProductCheck
                      key={key}
                      label={t(key)}
                      checked={form[key]}
                      onChange={(value) => update(key, value)}
                    />
                  ))}
                  <ProductField
                    label={t("sortOrder")}
                    name="sortOrder"
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={Number.isFinite(form.sortOrder) ? form.sortOrder : ""}
                    onChange={(event) => update("sortOrder", event.target.valueAsNumber)}
                  />
                </div>
              </section>
            </fieldset>
            {uploads.state.pending && (
              <p role="status" className={`text-sm ${mutedClass}`}>
                {t("uploadsPending")}
              </p>
            )}
            <div className="sticky -bottom-5 flex flex-wrap justify-end gap-3 border-t border-[#eee5e0] bg-[#faf8f6] py-4 sm:-bottom-7 dark:border-[#3a3431] dark:bg-[#292524]">
              <Button
                type="button"
                variant="outline"
                className={secondaryClass}
                disabled={busy}
                onClick={onClose}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className={primaryClass}
                disabled={
                  busy ||
                  uploads.state.pending ||
                  categoriesLoading ||
                  (!product && !categories.length)
                }
              >
                {saving && <LoaderCircle className="animate-spin" />}
                {t(saving ? "saving" : product ? "save" : "create")}
              </Button>
            </div>
          </form>
        </ValidationContext>
      </ProductUploadContext>
    </ProductModal>
  );
}
