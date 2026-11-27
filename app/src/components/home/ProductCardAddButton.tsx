"use client";

import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/components/cart/CartProvider";
import { Link } from "@/i18n/navigation";
import type { HomeLocale } from "@/lib/home-data";

export default function ProductCardAddButton({
  slug,
  variantId,
  productId,
  inStock,
}: {
  slug: string;
  variantId?: string;
  productId: string;
  inStock: boolean;
}) {
  const t = useTranslations("StorefrontProducts");
  const cartText = useTranslations("Cart");
  const cart = useCart();
  const locale = useLocale() as HomeLocale;
  const className = "mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8A6B56] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#765943] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a97872] disabled:cursor-not-allowed disabled:opacity-55";

  if (!variantId || !inStock) {
    return (
      <Link href={`/products/${slug}`} aria-disabled={!inStock} className={`${className} ${!inStock ? "pointer-events-none opacity-55" : ""}`}>
        <ShoppingBag size={19} aria-hidden="true" />
        {t("addToCart")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={cart.busy}
      onClick={() => {
        if (cart.unauthenticated) {
          const returnTo = `/${locale}/products/${slug}`;
          window.location.assign(`/${locale}/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        void cart.addItem(slug, variantId, 1, productId);
      }}
      aria-label={`${t("addToCart")}: ${slug}`}
      title={cart.busy ? cartText("addingToCart") : t("addToCart")}
    >
      <ShoppingBag size={19} aria-hidden="true" />
      {t("addToCart")}
    </button>
  );
}
