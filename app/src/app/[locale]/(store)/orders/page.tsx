import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ShoppingBag } from "lucide-react";

import { OrderStatus } from "@/components/orders/OrderStatus";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listCustomerOrders, requireOrderCustomer } from "@/lib/orders/customer";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CustomerOrders");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function OrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const requestedPage = (await searchParams).page;
  const page =
    typeof requestedPage === "string" && /^[1-9]\d{0,5}$/.test(requestedPage)
      ? Number(requestedPage)
      : 1;
  const customer = await requireOrderCustomer(locale, `/orders${page > 1 ? `?page=${page}` : ""}`);
  const [{ orders, totalPages }, t, format] = await Promise.all([
    listCustomerOrders(customer._id, page),
    getTranslations({ locale, namespace: "CustomerOrders" }),
    getFormatter({ locale }),
  ]);
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });

  return (
    <main
      className="min-h-[70vh] bg-[#faf8f6] px-4 py-10 text-[#352d2b] sm:px-6 lg:py-16 dark:bg-[#171717] dark:text-[#f5efec]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        {orders.length === 0 && page === 1 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-[#eee5e0] bg-white px-6 py-14 text-center dark:border-[#3a3431] dark:bg-[#292524]">
            <ShoppingBag className="size-10 text-[#a97872]" aria-hidden="true" />
            <p className="mt-4 font-semibold">{t("empty")}</p>
            <Button asChild className="mt-5">
              <Link href="/">{t("continueShopping")}</Link>
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#eee5e0] bg-white p-6 dark:border-[#3a3431] dark:bg-[#292524]">
            <p>{t("noPage")}</p>
            <Link href="/orders" className="mt-3 inline-block font-semibold underline">
              {t("firstPage")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-4">
              {orders.map((order) => (
                <li
                  key={String(order._id)}
                  className="rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-6 dark:border-[#3a3431] dark:bg-[#292524]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#817571] dark:text-[#aaa09b]">
                        {t("orderNumber")}
                      </p>
                      <p className="mt-1 font-semibold">
                        <bdi>{order.orderNumber}</bdi>
                      </p>
                      <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">
                        {format.dateTime(order.createdAt, { dateStyle: "medium" })}
                      </p>
                    </div>
                    <OrderStatus status={order.status} locale={locale} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-[#eee5e0] pt-4 dark:border-[#3a3431]">
                    <div className="text-sm">
                      <p>
                        {t("items", {
                          count: order.items.reduce((sum, item) => sum + item.quantity, 0),
                        })}
                      </p>
                      <p className="mt-1 font-semibold">
                        <bdi>{currency(order.total)}</bdi>
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/orders/${order._id}`}>{t("viewDetails")}</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav
                aria-label={t("pagination")}
                className="mt-8 flex items-center justify-center gap-4"
              >
                {page > 1 && (
                  <Button asChild variant="outline">
                    <Link href={page === 2 ? "/orders" : `/orders?page=${page - 1}`}>
                      {t("previous")}
                    </Link>
                  </Button>
                )}
                <span className="text-sm">{t("pageOf", { page, total: totalPages })}</span>
                {page < totalPages && (
                  <Button asChild variant="outline">
                    <Link href={`/orders?page=${page + 1}`}>{t("next")}</Link>
                  </Button>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
