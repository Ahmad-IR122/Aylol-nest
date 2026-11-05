import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import ProductImage from "@/components/home/ProductImage";
import { OrderStatus } from "@/components/orders/OrderStatus";
import { Link } from "@/i18n/navigation";
import { getCustomerOrder, requireOrderCustomer } from "@/lib/orders/customer";

type Props = { params: Promise<{ locale: string; orderId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CustomerOrders");
  return { title: t("detailsTitle"), robots: { index: false, follow: false } };
}

export default async function OrderDetailsPage({ params }: Props) {
  const { locale, orderId } = await params;
  if (!/^[a-f\d]{24}$/i.test(orderId)) notFound();
  const customer = await requireOrderCustomer(locale, `/orders/${orderId}`);
  const [order, t, format] = await Promise.all([
    getCustomerOrder(customer._id, orderId),
    getTranslations({ locale, namespace: "CustomerOrders" }),
    getFormatter({ locale }),
  ]);
  if (!order) notFound();
  const language = locale === "ar" ? "ar" : "en";
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });
  const address = order.shippingAddress;

  return (
    <main
      className="min-h-[70vh] bg-[#faf8f6] px-4 py-10 text-[#352d2b] sm:px-6 lg:py-16 dark:bg-[#171717] dark:text-[#f5efec]"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href="/orders"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#704c47] hover:underline dark:text-[#d4a39b]"
        >
          {t("backToOrders")}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{t("detailsTitle")}</h1>
            <p className="mt-2 font-semibold">
              <bdi>{order.orderNumber}</bdi>
            </p>
            <p className="mt-1 text-sm text-[#817571] dark:text-[#aaa09b]">
              {format.dateTime(order.createdAt, { dateStyle: "long" })}
            </p>
          </div>
          <OrderStatus status={order.status} locale={locale} />
        </div>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            className="min-w-0 rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-7 dark:border-[#3a3431] dark:bg-[#292524]"
            aria-label={t("itemsTitle")}
          >
            <h2 className="text-xl font-semibold">{t("itemsTitle")}</h2>
            <ul className="mt-5 space-y-5">
              {order.items.map((item, index) => (
                <li
                  key={`${item.sku}-${index}`}
                  className="flex gap-4 border-b border-[#eee5e0] pb-5 last:border-0 last:pb-0 dark:border-[#3a3431]"
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
                      {t("size")}: <bdi>{item.size}</bdi> · {t("color")}: {item.color?.[language]}
                    </p>
                    <p className="mt-1 text-sm text-[#817571] dark:text-[#aaa09b]">
                      {t("quantity", { count: item.quantity })} · {t("unitPrice")}:{" "}
                      <bdi>{currency(item.unitPrice)}</bdi>
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {t("lineTotal")}: <bdi>{currency(item.totalPrice)}</bdi>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-6 dark:border-[#3a3431] dark:bg-[#292524]">
              <h2 className="text-xl font-semibold">{t("summaryTitle")}</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>{t("subtotal")}</dt>
                  <dd>
                    <bdi>{currency(order.subtotal)}</bdi>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{t("shipping")}</dt>
                  <dd>
                    <bdi>{currency(order.shippingFee)}</bdi>
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-[#eee5e0] pt-4 text-lg font-semibold dark:border-[#3a3431]">
                  <dt>{t("total")}</dt>
                  <dd>
                    <bdi>{currency(order.total)}</bdi>
                  </dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-[#eee5e0] pt-4 text-sm dark:border-[#3a3431]">
                <p>
                  {t("paymentMethod")}:{" "}
                  {t(String(order.paymentMethod) === "online" ? "online" : "cashOnDelivery")}
                </p>
                <p className="mt-2">
                  {t("paymentStatus")}: {t(`payments.${order.paymentStatus}`)}
                </p>
              </div>
            </section>
            <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-6 dark:border-[#3a3431] dark:bg-[#292524]">
              <h2 className="text-xl font-semibold">{t("shippingTitle")}</h2>
              <address className="mt-4 text-sm leading-7 text-[#817571] not-italic dark:text-[#aaa09b]">
                {address.fullName}
                <br />
                <bdi>{address.phone}</bdi>
                <br />
                {t(`regions.${order.shippingRegion}`)}
                <br />
                {address.city}
                {address.area && (
                  <>
                    <br />
                    {address.area}
                  </>
                )}
                <br />
                {address.streetAddress}
                {address.building && (
                  <>
                    <br />
                    {t("building")}: {address.building}
                  </>
                )}
              </address>
              {(order.customerNotes || address.notes) && (
                <div className="mt-4 border-t border-[#eee5e0] pt-4 text-sm dark:border-[#3a3431]">
                  <h3 className="font-semibold">{t("notes")}</h3>
                  <p className="mt-2 wrap-anywhere whitespace-pre-wrap text-[#817571] dark:text-[#aaa09b]">
                    {order.customerNotes || address.notes}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
