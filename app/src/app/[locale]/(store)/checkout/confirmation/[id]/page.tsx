import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { CheckCircle2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import ProductImage from "@/components/home/ProductImage";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentCartUser } from "@/lib/auth/current-user";
import { orderForCustomer } from "@/lib/checkout/order-confirmation";
import type { HomeLocale } from "@/lib/home-data";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OrderConfirmation");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function ConfirmationPage({ params }: Props) {
  const { locale, id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();

  const { userId } = await auth();
  if (!userId)
    redirect(
      `/${locale}/sign-in?returnTo=${encodeURIComponent(`/${locale}/checkout/confirmation/${id}`)}`,
    );

  const user = await getCurrentCartUser();
  if (!user || user.role !== "customer") notFound();

  const order = await orderForCustomer(id, user._id);
  if (!order) notFound();

  const language: HomeLocale = locale === "ar" ? "ar" : "en";
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: "OrderConfirmation" }),
    getFormatter({ locale }),
  ]);
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });
  const region = order.shippingRegion;
  const regionName =
    region === "west_bank" || region === "jerusalem" || region === "inside_48"
      ? t(`regions.${region}`)
      : "";

  return (
    <main
      className="min-h-[70vh] bg-[#faf8f6] px-4 py-10 text-[#352d2b] sm:px-6 lg:py-16 dark:bg-[#171717] dark:text-[#f5efec]"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-[#eee5e0] bg-white p-6 text-center sm:p-10 dark:border-[#3a3431] dark:bg-[#292524]">
          <CheckCircle2
            className="mx-auto size-12 text-emerald-700 dark:text-emerald-300"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-sm leading-7 text-[#817571] dark:text-[#aaa09b]">
            {t("message")}
          </p>
          <p className="mt-5 text-sm font-semibold">{t("orderNumber")}</p>
          <p className="mt-1 text-xl font-bold tracking-wide">
            <bdi>{order.orderNumber}</bdi>
          </p>
          <p className="mt-3 text-xs text-[#817571] dark:text-[#aaa09b]">
            {format.dateTime(order.createdAt, { dateStyle: "medium" })}
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
          <section
            className="min-w-0 rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-7 dark:border-[#3a3431] dark:bg-[#292524]"
            aria-label={t("itemsTitle")}
          >
            <h2 className="text-xl font-semibold">{t("itemsTitle")}</h2>
            <ul className="mt-5 space-y-4">
              {order.items.map((item, index) => (
                <li
                  key={`${item.product}-${item.variantId}-${index}`}
                  className="flex gap-4 border-b border-[#eee5e0] pb-4 last:border-0 last:pb-0 dark:border-[#3a3431]"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eee5e0] dark:bg-[#3a3431]">
                    <ProductImage
                      src={item.imageUrl || null}
                      alt={item.name?.[language] || item.sku}
                      placeholder={t("imagePlaceholder")}
                      sizes="80px"
                      compact
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold wrap-anywhere">
                      {item.name?.[language] || item.sku}
                    </p>
                    <p className="mt-1 text-sm text-[#817571] dark:text-[#aaa09b]">
                      <bdi>{item.size}</bdi> · {item.color?.[language] || ""} ·{" "}
                      {t("quantity", { count: item.quantity })}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      <bdi>{currency(item.totalPrice)}</bdi>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-6 dark:border-[#3a3431] dark:bg-[#292524]">
            <h2 className="text-xl font-semibold">{t("summaryTitle")}</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span>{t("subtotal")}</span>
                <bdi>{currency(order.subtotal)}</bdi>
              </div>
              <div className="flex justify-between gap-3">
                <span>{t("shipping")}</span>
                <bdi>{currency(order.shippingFee)}</bdi>
              </div>
              <div className="flex justify-between gap-3 border-t border-[#eee5e0] pt-4 text-lg font-semibold dark:border-[#3a3431]">
                <span>{t("total")}</span>
                <bdi>{currency(order.total)}</bdi>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold">{t("cashOnDelivery")}</p>
            <div className="mt-5 border-t border-[#eee5e0] pt-5 text-sm dark:border-[#3a3431]">
              <h3 className="font-semibold">{t("deliveryTitle")}</h3>
              <p className="mt-2 leading-6 text-[#817571] dark:text-[#aaa09b]">
                {order.shippingAddress.fullName}
                <br />
                <bdi>{order.shippingAddress.phone}</bdi>
                <br />
                {regionName}
                {regionName && ", "}
                {order.shippingAddress.city}
                <br />
                {order.shippingAddress.streetAddress}
              </p>
            </div>
          </aside>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="h-11">
            <Link href={`/orders/${id}`}>{t("viewOrderDetails")}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/">{t("continueShopping")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
