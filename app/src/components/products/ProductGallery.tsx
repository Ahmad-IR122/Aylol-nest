"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import ProductImage from "@/components/home/ProductImage";
import type { HomeLocale } from "@/lib/home-data";
import type { StorefrontImage } from "@/types/storefront";

export default function ProductGallery({
  images,
  name,
}: {
  images: StorefrontImage[];
  name: string;
}) {
  const locale = useLocale() as HomeLocale;
  const t = useTranslations("ProductDetails");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const currentIndex = Math.min(selectedIndex, Math.max(0, images.length - 1));
  const current = images[currentIndex];
  const multipleImages = images.length > 1;
  const direction = locale === "ar" ? -1 : 1;

  function move(step: number) {
    setSelectedIndex((index) => Math.max(0, Math.min(images.length - 1, index + step)));
  }

  function imageAlt(image: StorefrontImage | undefined, index: number) {
    return image?.alt[locale] || t("imageAlt", { name, number: index + 1 });
  }

  const arrowClass =
    "flex size-11 items-center justify-center rounded-full border border-[#eee5e0] bg-white/95 text-[#352d2b] shadow-sm transition-colors hover:bg-[#faf8f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] disabled:cursor-not-allowed disabled:opacity-35 dark:border-[#3a3431] dark:bg-[#292524]/95 dark:text-[#f5efec] dark:hover:bg-[#3a3431] dark:focus-visible:outline-[#d4a39b]";

  return (
    <section aria-label={t("galleryLabel", { name })} className="min-w-0">
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-3xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current =
            event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const touch = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !touch || !multipleImages) return;
          const horizontal = start.x - touch.clientX;
          const vertical = start.y - touch.clientY;
          if (Math.abs(horizontal) >= 48 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) {
            move(Math.sign(horizontal) * direction);
          }
        }}
      >
        <ProductImage
          src={current?.url ?? null}
          alt={imageAlt(current, currentIndex)}
          placeholder={t("imagePlaceholder")}
          fit="contain"
          sizes="(min-width: 1280px) 600px, (min-width: 1024px) 48vw, calc(100vw - 32px)"
          preload={currentIndex === 0}
          className="p-4 sm:p-6"
        />

        {multipleImages && (
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="rounded-full border border-[#eee5e0] bg-white/95 px-3 py-2 text-xs font-semibold text-[#817571] dark:border-[#3a3431] dark:bg-[#292524]/95 dark:text-[#aaa09b]"
            >
              {t("imageCounter", { current: currentIndex + 1, total: images.length })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={t("previousImage")}
                disabled={currentIndex === 0}
                onClick={() => move(-1)}
                className={arrowClass}
              >
                <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t("nextImage")}
                disabled={currentIndex === images.length - 1}
                onClick={() => move(1)}
                className={arrowClass}
              >
                <ChevronRight className="size-5 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {multipleImages && (
        <div className="mt-4 flex gap-3 overflow-x-auto p-1 pb-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              aria-label={t("viewImage", { number: index + 1 })}
              aria-pressed={currentIndex === index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-[4/5] w-18 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97872] sm:w-20 dark:bg-[#292524] dark:focus-visible:outline-[#d4a39b] ${
                currentIndex === index
                  ? "border-[#a97872] dark:border-[#d4a39b]"
                  : "border-[#eee5e0] hover:border-[#a97872]/60 dark:border-[#3a3431] dark:hover:border-[#d4a39b]/60"
              }`}
            >
              <ProductImage
                src={image.url}
                alt={imageAlt(image, index)}
                placeholder={t("imagePlaceholder")}
                fit="contain"
                compact
                sizes="80px"
                className="p-1"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
