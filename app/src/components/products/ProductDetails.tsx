"use client";

import { useRef, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Truck, Wallet } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useCart } from "@/components/cart/CartProvider";
import { useRouter } from "@/i18n/navigation";
import ProductGallery from "@/components/products/ProductGallery";
import { Button } from "@/components/ui/button";
import type { HomeLocale } from "@/lib/home-data";
import {
  colorKey,
  findSelectedVariant,
  galleryImages,
  quantityForStock,
  sizeKey,
} from "@/lib/products/selection";
import type { StorefrontProduct } from "@/types/storefront";

export default function ProductDetails({ product }: { product: StorefrontProduct }) {
  const locale = useLocale() as HomeLocale;
  const t = useTranslations("ProductDetails");
  const cartText = useTranslations("Cart");
  const format = useFormatter();
  const cart = useCart();
  const router = useRouter();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const submitting = useRef(false);
  const variants = product.variants;
  const selected = findSelectedVariant(variants, size, color);
  const inStock = variants.some((variant) => variant.stock > 0);
  const sizes = [
    ...new Map(variants.map((variant) => [sizeKey(variant.size), variant.size])).entries(),
  ];
  const colors = [
    ...new Map(variants.map((variant) => [colorKey(variant), variant.color])).entries(),
  ];
  const prices = variants.map((variant) => variant.price);
  const price = selected?.price ?? (prices.length ? Math.min(...prices) : null);
  const priceRange = !selected && prices.some((value) => value !== price);
  const stock = selected?.stock ?? 0;
  const safeQuantity = quantityForStock(quantity, stock);
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });
  const optionClass =
    "min-h-12 rounded-xl border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a97872] disabled:cursor-not-allowed disabled:opacity-40";
  const activeClass =
    "border-[#a97872] bg-[#f8eeeb] text-[#704c47] dark:border-[#d4a39b] dark:bg-[#3b2d2b] dark:text-[#d4a39b]";
  const idleClass =
    "border-[#eee5e0] bg-white hover:border-[#a97872] dark:border-[#3a3431] dark:bg-[#292524] dark:hover:border-[#d4a39b]";

  function selectSize(nextSize: string) {
    setSize(nextSize);
    const next = findSelectedVariant(variants, nextSize, color);
    if (!next || next.stock <= 0) setColor("");
    setQuantity(1);
    setFeedback(null);
  }

  async function addToCart(buyNow = false) {
    if (submitting.current || cart.busy) return;
    if (!size || !color || !selected) {
      setFeedback({ ok: false, message: t("selectOptions") });
      return;
    }
    if (selected.stock < 1) {
      setFeedback({ ok: false, message: cartText("errors.unavailable") });
      return;
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > selected.stock) {
      setFeedback({ ok: false, message: cartText("errors.stock") });
      return;
    }
    const productPath = `/${locale}/products/${product.slug}`;
    if (cart.unauthenticated) {
      router.push(`/sign-in?returnTo=${encodeURIComponent(productPath)}`);
      return;
    }
    submitting.current = true;
    try {
      const result = await cart.addItem(product.slug, selected.id, quantity, product.id);
      if (result.ok) {
        setFeedback({ ok: true, message: t("addedToCart") });
        if (buyNow) router.push("/cart");
      } else if (result.error === "unauthorized") {
        router.push(`/sign-in?returnTo=${encodeURIComponent(productPath)}`);
      } else {
        setFeedback({ ok: false, message: cartText(`errors.${result.error}`) });
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <div className="grid items-start gap-9 lg:grid-cols-2 lg:gap-14 xl:gap-20">
      <div className="min-w-0 lg:sticky lg:top-32">
        <ProductGallery
          key={selected?.id ?? "all"}
          images={galleryImages(product.images, variants, selected)}
          name={product.name[locale]}
        />
      </div>

      <div className="min-w-0 py-1 lg:py-5">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold">
          {product.category && (
            <span className="text-[#817571] dark:text-[#aaa09b]">
              {product.category.name[locale]}
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-[#f0e5df] px-3 py-1.5 text-[#704c47] dark:bg-[#3b2d2b] dark:text-[#d4a39b]">
              {t("newArrival")}
            </span>
          )}
        </div>
        <h1 className="text-3xl leading-snug font-semibold wrap-anywhere sm:text-4xl">
          {product.name[locale]}
        </h1>
        <div
          className="mt-5 flex flex-wrap items-baseline gap-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-2xl font-semibold sm:text-3xl">
            <bdi>
              {price === null
                ? t("priceUnavailable")
                : priceRange
                  ? t("fromPrice", { price: currency(price) })
                  : currency(price)}
            </bdi>
          </p>
          {selected?.compareAtPrice != null && selected.compareAtPrice > selected.price && (
            <del className="text-base text-[#817571] dark:text-[#aaa09b]">
              <bdi>{currency(selected.compareAtPrice)}</bdi>
            </del>
          )}
          <span className="text-xs text-[#817571] dark:text-[#aaa09b]">{t("currency")}</span>
        </div>
        <p
          className={`mt-4 inline-flex items-center gap-2 text-sm ${inStock ? "text-emerald-800 dark:text-emerald-300" : "text-[#817571] dark:text-[#aaa09b]"}`}
        >
          <span
            className={`size-1.5 rounded-full ${inStock ? "bg-emerald-600 dark:bg-emerald-400" : "bg-stone-400"}`}
            aria-hidden="true"
          />
          {t(inStock ? "inStock" : "outOfStock")}
        </p>
        {product.description[locale] && (
          <p className="mt-5 line-clamp-3 text-sm leading-7 whitespace-pre-line text-[#817571] dark:text-[#aaa09b]">
            {product.description[locale]}
          </p>
        )}

        <div className="mt-7 space-y-6 border-t border-[#eee5e0] pt-7 dark:border-[#3a3431]">
          <fieldset disabled={cart.busy}>
            <legend className="mb-3 text-sm font-semibold">{t("size")}</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map(([key, label]) => {
                const available = variants.some(
                  (variant) => sizeKey(variant.size) === key && variant.stock > 0,
                );
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={size === key}
                    disabled={!available}
                    title={!available ? t("outOfStock") : undefined}
                    onClick={() => selectSize(key)}
                    className={`${optionClass} min-w-14 ${size === key ? activeClass : idleClass} ${!available ? "line-through" : ""}`}
                  >
                    <bdi>{label}</bdi>
                  </button>
                );
              })}
            </div>
            {sizes.length === 0 && (
              <p className="text-sm text-[#817571] dark:text-[#aaa09b]">{t("noVariants")}</p>
            )}
          </fieldset>

          <fieldset disabled={cart.busy || !size} aria-describedby="color-hint">
            <legend className="mb-3 text-sm font-semibold">{t("color")}</legend>
            <div className="flex flex-wrap gap-2">
              {colors.map(([key, value]) => {
                const candidate = findSelectedVariant(variants, size, key);
                const available = !!candidate && candidate.stock > 0;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={color === key}
                    disabled={!available}
                    onClick={() => {
                      setColor(key);
                      setQuantity(1);
                      setFeedback(null);
                    }}
                    className={`${optionClass} inline-flex items-center gap-2.5 ${color === key ? activeClass : idleClass}`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-5 shrink-0 rounded-full border border-black/15 dark:border-white/25"
                      style={{ backgroundColor: value.hex }}
                    />
                    <span className="wrap-anywhere">{value.name[locale]}</span>
                    {color === key && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <p id="color-hint" className="-mt-3 text-xs leading-6 text-[#817571] dark:text-[#aaa09b]">
            {t(!size ? "chooseSizeFirst" : "unavailableOptions")}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p id="quantity-label" className="mb-3 text-sm font-semibold">
                {t("quantity")}
              </p>
              <div
                className="inline-flex h-12 items-center rounded-xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]"
                role="group"
                aria-labelledby="quantity-label"
              >
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(safeQuantity - 1);
                    setFeedback(null);
                  }}
                  disabled={!selected || stock < 1 || safeQuantity <= 1 || cart.busy}
                  aria-label={t("decreaseQuantity")}
                  className="flex size-12 items-center justify-center rounded-s-xl focus-visible:outline-2 focus-visible:outline-[#a97872] disabled:opacity-30"
                >
                  <Minus className="size-4" />
                </button>
                <output className="min-w-10 text-center text-sm font-semibold" aria-live="polite">
                  {format.number(safeQuantity)}
                </output>
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(safeQuantity + 1);
                    setFeedback(null);
                  }}
                  disabled={!selected || stock < 1 || safeQuantity >= stock || cart.busy}
                  aria-label={t("increaseQuantity")}
                  className="flex size-12 items-center justify-center rounded-e-xl focus-visible:outline-2 focus-visible:outline-[#a97872] disabled:opacity-30"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <div className="max-w-full text-sm text-[#817571] dark:text-[#aaa09b]" role="status">
              {selected ? (
                <>
                  <p>{t(stock > 0 ? "stockCount" : "outOfStock", { count: stock })}</p>
                  {stock > 0 && safeQuantity >= stock && (
                    <p className="mt-1 text-xs">{t("stockLimit")}</p>
                  )}
                </>
              ) : (
                <p>{t("selectOptions")}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              className="h-14 w-full gap-3 rounded-xl bg-[#a97872] text-base font-semibold text-white hover:bg-[#91645e] dark:bg-[#d4a39b] dark:text-[#171717] dark:hover:bg-[#e4b7af]"
              disabled={!selected || stock < 1 || cart.busy}
              onClick={() => void addToCart()}
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              {t(cart.busy ? "addingToCart" : "addToCart")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!selected || stock < 1 || cart.busy}
              onClick={() => void addToCart(true)}
              className="h-14 w-full rounded-xl border-[#a97872]/50 bg-transparent text-base font-semibold text-[#704c47] disabled:opacity-65 dark:border-[#d4a39b]/50 dark:text-[#d4a39b]"
            >
              {t(cart.busy ? "addingToCart" : "buyNow")}
            </Button>
            <p
              id="checkout-message"
              className="text-xs leading-6 text-[#817571] dark:text-[#aaa09b]"
            >
              {t("buyNowCartHint")}
            </p>
            <div aria-live="polite" aria-atomic="true">
              {feedback && (
                <div
                  className={`rounded-xl p-4 text-sm leading-6 ${feedback.ok ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}
                >
                  <p>{feedback.message}</p>
                  {feedback.ok && (
                    <button
                      type="button"
                      onClick={cart.openCart}
                      className="mt-1 min-h-11 font-semibold underline underline-offset-4"
                    >
                      {t("viewCart")}
                    </button>
                  )}
                  {feedback.ok && cart.sessionOnly && (
                    <p className="mt-1 text-xs">{cartText("sessionOnly")}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-[#eee5e0] bg-white p-5 text-sm sm:grid-cols-2 dark:border-[#3a3431] dark:bg-[#292524]">
          <div className="flex items-center gap-3">
            <Wallet
              className="size-5 shrink-0 text-[#a97872] dark:text-[#d4a39b]"
              aria-hidden="true"
            />
            <span>{t("cashOnDelivery")}</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck
              className="size-5 shrink-0 text-[#a97872] dark:text-[#d4a39b]"
              aria-hidden="true"
            />
            <a
              href="#delivery"
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              {t("deliveryDetails")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
