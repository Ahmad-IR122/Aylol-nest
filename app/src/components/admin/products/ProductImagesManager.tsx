"use client";

import { useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { ImagePlus, LoaderCircle, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductImage } from "@/types/product";
import { PRODUCT_IMAGE_TYPES } from "@/lib/products/image-upload";
import { useProductImageUploads } from "@/hooks/admin/useProductImageUploads";
import {
  ProductField,
  ProductNotice,
  ProductThumbnail,
  mutedClass,
  primaryClass,
  secondaryClass,
} from "./ProductUi";

export default function ProductImagesManager({
  images,
  onChange,
  prefix = "images",
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  prefix?: string;
}) {
  const t = useTranslations("Products");
  const language = useLocale() === "ar" ? "ar" : "en";
  const upload = useProductImageUploads(images, onChange);
  const picker = useRef<HTMLInputElement>(null);
  const replacement = useRef<number | undefined>(undefined);
  function pick(index?: number) {
    replacement.current = index;
    if (picker.current) {
      picker.current.multiple = index === undefined;
      picker.current.click();
    }
  }
  function update(index: number, changes: Partial<ProductImage>) {
    onChange(
      images.map((image, position) => (position === index ? { ...image, ...changes } : image)),
    );
  }
  return (
    <div className="space-y-4" aria-busy={upload.uploading}>
      <input
        ref={picker}
        type="file"
        multiple
        accept={PRODUCT_IMAGE_TYPES.join(",")}
        className="hidden"
        aria-label={t("selectImages")}
        disabled={upload.uploading}
        onChange={(event) => {
          if (event.target.files) upload.select(event.target.files, replacement.current);
          event.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#e8ddd7] bg-white p-6 text-center dark:border-[#3a3431] dark:bg-[#211e1c]">
        <ImagePlus className="text-[#a97872] dark:text-[#d4a39b]" size={30} />
        <p className="text-sm font-semibold">{t("uploadTitle")}</p>
        <p className={`text-xs ${mutedClass}`}>{t("uploadLimits")}</p>
        <Button
          type="button"
          variant="outline"
          className={secondaryClass}
          disabled={upload.uploading}
          onClick={() => pick()}
        >
          <ImagePlus />
          {t("selectImages")}
        </Button>
      </div>
      {upload.error && <ProductNotice>{t(`errors.${upload.error}`)}</ProductNotice>}
      {upload.success && <ProductNotice success>{t("uploadSuccess")}</ProductNotice>}
      {upload.queue.length > 0 && (
        <div className="space-y-4 rounded-xl border border-[#eee5e0] p-4 dark:border-[#3a3431]">
          <p className="text-sm font-semibold">{t("selectedImages")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {upload.queue.map((item) => (
              <div key={item.key} className="min-w-0 space-y-2">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-[#f4ede8] dark:bg-[#211e1c]">
                  <Image
                    src={item.preview}
                    alt={item.file.name}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`min-w-0 truncate text-xs ${mutedClass}`}>{item.file.name}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-11 shrink-0 text-red-600 dark:text-red-300"
                    disabled={upload.uploading}
                    aria-label={`${t("removeImage")}: ${item.file.name}`}
                    onClick={() => upload.removePending(item.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {item.replaceIndex !== undefined && (
                  <p className={`text-xs ${mutedClass}`}>
                    {t("replacingImage", { number: item.replaceIndex + 1 })}
                  </p>
                )}
                {item.error && <ProductNotice>{t(`errors.${item.error}`)}</ProductNotice>}
              </div>
            ))}
          </div>
          <p className={`text-xs leading-relaxed ${mutedClass}`}>{t("uploadsPending")}</p>
          <Button
            type="button"
            className={primaryClass}
            disabled={upload.uploading}
            onClick={() => void upload.upload()}
          >
            {upload.uploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
            {t(upload.uploading ? "uploadingImages" : "uploadImages")}
          </Button>
        </div>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {upload.uploading ? t("uploadingImages") : ""}
      </div>
      {images.map((image, index) => (
        <fieldset
          key={`${image.publicId}-${index}`}
          className="min-w-0 rounded-xl border border-[#eee5e0] p-4 dark:border-[#3a3431]"
        >
          <legend className={`px-2 text-xs ${mutedClass}`}>
            {t("imageNumber", { number: index + 1 })}
          </legend>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ProductThumbnail url={image.url} alt={image.alt?.[language] || t("imageAlt")} />
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                className={secondaryClass}
                disabled={upload.uploading}
                onClick={() => pick(index)}
              >
                <RefreshCw />
                {t("replaceImage")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="size-11 text-red-600 dark:text-red-300"
                disabled={upload.uploading || upload.queue.length > 0}
                aria-label={`${t("removeImage")} ${index + 1}`}
                onClick={() => onChange(images.filter((_, position) => position !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(["ar", "en"] as const).map((lang) => (
              <ProductField
                key={lang}
                label={t(lang === "ar" ? "altAr" : "altEn")}
                name={`${prefix}.${index}.alt.${lang}`}
                dir={lang === "ar" ? "rtl" : "ltr"}
                value={image.alt?.[lang] ?? ""}
                onChange={(event) =>
                  update(index, { alt: { ...image.alt, [lang]: event.target.value } })
                }
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
