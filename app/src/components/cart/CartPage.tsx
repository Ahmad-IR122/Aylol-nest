"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductImage from "@/components/home/ProductImage";
import { Button } from "@/components/ui/button";
import type { HomeLocale } from "@/lib/home-data";
import { useCart } from "./CartProvider";

export default function CartPage() {
  const cart = useCart();
  const locale = useLocale() as HomeLocale;
  const t = useTranslations("Cart");
  const format = useFormatter();
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });

  return (
    <main
      className="min-h-[60vh] bg-[#faf8f6] px-4 py-10 text-[#352d2b] sm:px-6 lg:py-16 dark:bg-[#171717] dark:text-[#f5efec]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">
          {t("count", { count: cart.count })}
        </p>
        {cart.loading && (
          <p role="status" className="mt-8">
            {t("checking")}
          </p>
        )}
        {cart.unauthenticated ? (
          <div className="mt-10 rounded-2xl border border-[#eee5e0] bg-white p-8 dark:border-[#3a3431] dark:bg-[#292524]">
            <p>{t("signInRequired")}</p>
            <Button asChild className="mt-5">
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
          </div>
        ) : (
          <>
            {cart.error && (
              <div
                role="alert"
                className="mt-8 rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200"
              >
                <p>{t(`errors.${cart.error}`)}</p>
                <Button variant="outline" className="mt-3" onClick={() => void cart.refresh()}>
                  {t("retry")}
                </Button>
              </div>
            )}
            {!cart.loading && !cart.error && cart.items.length === 0 && (
              <div className="mt-10 flex flex-col items-center rounded-2xl border border-[#eee5e0] bg-white px-5 py-14 text-center dark:border-[#3a3431] dark:bg-[#292524]">
                <ShoppingBag className="mb-4 size-10 text-[#a97872]" aria-hidden="true" />
                <p>{t("empty")}</p>
                <Button asChild variant="outline" className="mt-6">
                  <Link href="/">{t("continueShopping")}</Link>
                </Button>
              </div>
            )}
            {cart.items.length > 0 && (
              <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section aria-label={t("title")} className="min-w-0 space-y-4">
                  {cart.items.map((item) => (
                    <article
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-[#eee5e0] bg-white p-4 sm:gap-6 sm:p-6 dark:border-[#3a3431] dark:bg-[#292524]"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eee5e0] sm:h-36 sm:w-28 dark:bg-[#3a3431]"
                        aria-label={item.name[locale]}
                      >
                        <ProductImage
                          src={item.image}
                          alt={item.name[locale]}
                          placeholder={t("imagePlaceholder")}
                          sizes="(max-width: 640px) 80px, 112px"
                          compact
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-semibold wrap-anywhere hover:underline"
                        >
                          {item.name[locale]}
                        </Link>
                        <p className="mt-1 text-sm text-[#817571] dark:text-[#aaa09b]">
                          <bdi>{item.size}</bdi> · {item.color[locale]}
                        </p>
                        <p className="mt-2 text-sm">
                          {t("unitPrice")}: <bdi>{currency(item.price)}</bdi>
                        </p>
                        {!item.available && (
                          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
                            {t("stockWarning", { count: item.stock })}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
                              className="min-w-8 text-center tabular-nums"
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
                            onClick={() => void cart.removeItem(item)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                        <p className="mt-3 font-semibold">
                          {t("itemSubtotal")}: <bdi>{currency(item.lineTotal)}</bdi>
                        </p>
                      </div>
                    </article>
                  ))}
                  <Button
                    variant="outline"
                    disabled={cart.busy}
                    onClick={() => void cart.clearCart()}
                  >
                    {t("clear")}
                  </Button>
                </section>
                <aside className="rounded-2xl border border-[#eee5e0] bg-white p-6 dark:border-[#3a3431] dark:bg-[#292524]">
                  <div className="flex justify-between gap-4 text-lg font-semibold">
                    <span>{t("subtotal")}</span>
                    <bdi>{currency(cart.subtotal)}</bdi>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[#817571] dark:text-[#aaa09b]">
                    {t("shippingExcluded")}
                  </p>
                  {cart.loading || cart.busy || cart.items.some((item) => !item.available) ? (
                    <Button disabled className="mt-6 h-12 w-full bg-[#a97872] dark:bg-[#d4a39b]">
                      {t("checkout")}
                    </Button>
                  ) : (
                    <Button asChild className="mt-6 h-12 w-full bg-[#a97872] dark:bg-[#d4a39b]">
                      <Link href="/checkout">{t("checkout")}</Link>
                    </Button>
                  )}
                  <p
                    id="cart-page-checkout-note"
                    className="mt-3 text-xs leading-6 text-[#817571] dark:text-[#aaa09b]"
                  >
                    {t(
                      cart.items.some((item) => !item.available)
                        ? "checkoutStockWarning"
                        : "checkoutHint",
                    )}
                  </p>
                  <Button asChild variant="outline" className="mt-5 w-full">
                    <Link href="/">{t("continueShopping")}</Link>
                  </Button>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
