"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductImage from "@/components/home/ProductImage";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cartKey } from "@/lib/cart/state";
import type { HomeLocale } from "@/lib/home-data";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const cart = useCart();
  const locale = useLocale() as HomeLocale;
  const t = useTranslations("Cart");
  const format = useFormatter();
  const currency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "ILS",
      currencyDisplay: "narrowSymbol",
    });
  const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <Sheet open={cart.open} onOpenChange={(open) => (open ? cart.openCart() : cart.closeCart())}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          cart.restoreFocus();
        }}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="gap-0 border-[#eee5e0] bg-[#faf8f6] text-[#352d2b] data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md dark:border-[#3a3431] dark:bg-[#171717] dark:text-[#f5efec]"
      >
        <SheetHeader className="border-b border-[#eee5e0] p-6 pe-16 dark:border-[#3a3431]">
          <SheetTitle className="text-xl text-inherit">{t("title")}</SheetTitle>
          <SheetDescription className="mt-1 text-[#817571] dark:text-[#aaa09b]">
            {t("count", { count: cart.count })}
          </SheetDescription>
        </SheetHeader>
        <Button
          variant="ghost"
          size="icon"
          onClick={cart.closeCart}
          aria-label={t("close")}
          className="absolute end-4 top-4 size-11"
        >
          <X aria-hidden="true" />
        </Button>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6" aria-busy={cart.busy}>
          <div role="status" aria-live="polite" className="space-y-2 text-sm">
            {cart.busy && <p className="mb-4">{t("checking")}</p>}
            {cart.sessionOnly && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                {t("sessionOnly")}
              </p>
            )}
            {cart.adjusted && (
              <p className="mb-4 rounded-xl bg-[#eee5e0] p-3 dark:bg-[#292524]">{t("adjusted")}</p>
            )}
          </div>
          {cart.error && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
            >
              <p>{t(`errors.${cart.error}`)}</p>
              <button
                type="button"
                disabled={cart.busy}
                onClick={cart.openCart}
                className="mt-2 min-h-11 underline underline-offset-4 disabled:opacity-50"
              >
                {t("retry")}
              </button>
            </div>
          )}
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingBag
                className="size-10 text-[#a97872] dark:text-[#d4a39b]"
                aria-hidden="true"
              />
              <p>{t(cart.error ? "restoreFailed" : "empty")}</p>
              <Button variant="outline" onClick={cart.closeCart} className="min-h-11">
                {t("continueShopping")}
              </Button>
            </div>
          ) : (
            <ul className="space-y-6">
              {cart.items.map((item) => (
                <li
                  key={cartKey(item)}
                  className="flex gap-4 border-b border-[#eee5e0] pb-6 dark:border-[#3a3431]"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={cart.closeCart}
                    className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eee5e0] dark:bg-[#292524]"
                    aria-label={item.name[locale]}
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name[locale]}
                      placeholder={t("imagePlaceholder")}
                      sizes="80px"
                      compact
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={cart.closeCart}
                      className="font-semibold wrap-anywhere hover:underline"
                    >
                      {item.name[locale]}
                    </Link>
                    <p className="mt-1 text-xs wrap-anywhere text-[#817571] dark:text-[#aaa09b]">
                      <bdi>{item.size}</bdi> · {item.color[locale]}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      <bdi>{currency(item.price * item.quantity)}</bdi>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center rounded-lg border border-[#eee5e0] dark:border-[#3a3431]">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          disabled={cart.busy || item.quantity <= 1}
                          aria-label={t("decrease", { name: item.name[locale] })}
                          onClick={() => void cart.updateQuantity(item, item.quantity - 1)}
                        >
                          <Minus aria-hidden="true" />
                        </Button>
                        <span
                          className="min-w-7 text-center tabular-nums"
                          aria-label={t("quantity")}
                        >
                          {format.number(item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          disabled={cart.busy || item.quantity >= item.stock}
                          aria-label={t("increase", { name: item.name[locale] })}
                          onClick={() => void cart.updateQuantity(item, item.quantity + 1)}
                        >
                          <Plus aria-hidden="true" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11"
                        disabled={cart.busy}
                        aria-label={t("remove", { name: item.name[locale] })}
                        onClick={() => cart.removeItem(item)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#eee5e0] p-6 dark:border-[#3a3431]">
          <div className="flex items-center justify-between gap-4 text-lg font-semibold">
            <span>{t("subtotal")}</span>
            <bdi>{currency(subtotal)}</bdi>
          </div>
          <p className="mt-2 text-xs leading-6 text-[#817571] dark:text-[#aaa09b]">
            {t("shippingExcluded")}
          </p>
          <Button
            disabled
            aria-describedby="cart-checkout-message"
            className="mt-4 h-12 w-full rounded-xl bg-[#a97872] text-white dark:bg-[#d4a39b] dark:text-[#171717]"
          >
            {t("checkout")}
          </Button>
          <p
            id="cart-checkout-message"
            className="mt-3 text-xs leading-6 text-[#817571] dark:text-[#aaa09b]"
          >
            {t("checkoutUnavailable")}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
