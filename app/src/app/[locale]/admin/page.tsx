import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowUpRight,
  ClipboardList,
  Package,
  ShoppingBag,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import { getDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";
const panel =
  "min-w-0 rounded-2xl border border-[#eee5e0] bg-white p-5 shadow-sm dark:border-[#3a3431] dark:bg-[#292524]";

export default async function AdminDashboardPage() {
  const [locale, t, data] = await Promise.all([
    getLocale(),
    getTranslations("AdminDashboard"),
    getDashboardData(),
  ]);
  const number = new Intl.NumberFormat(locale);
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ILS",
    currencyDisplay: "narrowSymbol",
  });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const ordersHref = `/${locale}/admin/orders`;
  const productsHref = `/${locale}/admin/products`;
  const cards = [
    {
      label: t("totalOrders"),
      value: number.format(data.totalOrders),
      href: ordersHref,
      icon: ShoppingBag,
    },
    {
      label: t("totalRevenue"),
      value: currency.format(data.totalRevenue),
      href: ordersHref,
      icon: Wallet,
    },
    { label: t("totalCustomers"), value: number.format(data.totalCustomers), icon: Users },
    {
      label: t("totalProducts"),
      value: number.format(data.totalProducts),
      href: productsHref,
      icon: Package,
    },
    {
      label: t("pendingOrders"),
      value: number.format(data.pendingOrders),
      href: `${ordersHref}?status=pending`,
      icon: ClipboardList,
    },
    {
      label: t("lowStockProducts"),
      value: number.format(data.lowStockCount),
      href: productsHref,
      icon: TriangleAlert,
    },
  ];
  const maxRevenue = Math.max(...data.revenueDays.map((day) => day.revenue), 1);
  return (
    <main className="min-h-dvh bg-[#faf8f6] px-5 py-8 md:px-10 dark:bg-[#171717]">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-[#a97872] dark:text-[#d4a39b]">Aylol Nest</p>
          <h1 className="mt-2 text-3xl font-bold text-[#352d2b] dark:text-[#f5efec]">
            {t("title")}
          </h1>
          <p className="mt-2 text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        </header>
        <section aria-label={t("summary")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ label, value, href, icon: Icon }) => {
            const content = (
              <>
                <div className="flex items-center justify-between text-[#a97872] dark:text-[#d4a39b]">
                  <Icon size={24} aria-hidden="true" />
                  {href && <ArrowUpRight size={18} aria-hidden="true" />}
                </div>
                <p className="mt-5 text-sm text-[#817571] dark:text-[#aaa09b]">{label}</p>
                <p
                  className="mt-1 text-3xl font-bold text-[#352d2b] dark:text-[#f5efec]"
                  dir="auto"
                >
                  {value}
                </p>
              </>
            );
            return href ? (
              <Link
                key={label}
                href={href}
                className={`${panel} transition hover:border-[#a97872] hover:shadow-md`}
              >
                {content}
              </Link>
            ) : (
              <div key={label} className={panel}>
                {content}
              </div>
            );
          })}
        </section>
        <div className="grid gap-6 xl:grid-cols-2">
          <section className={panel} aria-labelledby="revenue-heading">
            <h2 id="revenue-heading" className="text-xl font-bold">
              {t("revenueChart")}
            </h2>
            <p className="mt-1 text-sm text-[#817571] dark:text-[#aaa09b]">
              {t("deliveredRevenue")}
            </p>
            <div
              className="mt-6 flex h-52 items-end gap-2 sm:gap-4"
              role="img"
              aria-label={t("revenueChart")}
            >
              {data.revenueDays.map((day) => (
                <div
                  key={day.date}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  title={`${day.date}: ${currency.format(day.revenue)}`}
                >
                  <span className="truncate text-xs font-medium" dir="auto">
                    {currency.format(day.revenue)}
                  </span>
                  <div
                    className="w-full max-w-14 rounded-t-md bg-[#a97872] dark:bg-[#d4a39b]"
                    style={{
                      height: `${Math.max((day.revenue / maxRevenue) * 100, day.revenue ? 4 : 1)}%`,
                    }}
                  />
                  <span className="text-xs text-[#817571] dark:text-[#aaa09b]">
                    {weekday.format(new Date(`${day.date}T12:00:00Z`))}
                  </span>
                </div>
              ))}
            </div>
            {data.revenueDays.every((day) => day.revenue === 0) && (
              <p className="mt-4 text-sm text-[#817571] dark:text-[#aaa09b]">{t("noRevenue")}</p>
            )}
          </section>
          <section className={panel} aria-labelledby="statuses-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="statuses-heading" className="text-xl font-bold">
                {t("ordersByStatus")}
              </h2>
              <Link
                href={ordersHref}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[#a97872] dark:text-[#d4a39b]"
              >
                {t("viewOrders")}
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.statuses.map(({ status, count }) => (
                <Link
                  key={status}
                  href={`${ordersHref}?status=${status}`}
                  className="flex items-center justify-between rounded-xl bg-[#faf8f6] px-4 py-3 text-sm hover:bg-[#f8eeeb] dark:bg-[#211e1c] dark:hover:bg-[#3b2d2b]"
                >
                  <span>{t(`statuses.${status}`)}</span>
                  <strong>{number.format(count)}</strong>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <section className={panel} aria-labelledby="recent-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="recent-heading" className="text-xl font-bold">
                {t("recentOrders")}
              </h2>
              <Link
                href={ordersHref}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[#a97872] dark:text-[#d4a39b]"
              >
                {t("viewOrders")}
              </Link>
            </div>
            {data.recentOrders.length === 0 ? (
              <p className="mt-6 text-sm text-[#817571] dark:text-[#aaa09b]">{t("noOrders")}</p>
            ) : (
              <div className="mt-4 divide-y divide-[#eee5e0] dark:divide-[#3a3431]">
                {data.recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href={ordersHref}
                    className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm hover:text-[#a97872]"
                  >
                    <div>
                      <p className="font-semibold" dir="ltr">
                        {order.orderNumber}
                      </p>
                      <p className="text-[#817571] dark:text-[#aaa09b]">
                        {order.customer} · {date.format(new Date(order.createdAt))}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-semibold" dir="auto">
                        {currency.format(order.total)}
                      </p>
                      <p className="text-[#817571] dark:text-[#aaa09b]">
                        {t(`statuses.${order.status}`)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className={panel} aria-labelledby="stock-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="stock-heading" className="text-xl font-bold">
                {t("lowStockAlerts")}
              </h2>
              <Link
                href={productsHref}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[#a97872] dark:text-[#d4a39b]"
              >
                {t("viewProducts")}
              </Link>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="mt-6 text-sm text-[#817571] dark:text-[#aaa09b]">{t("noLowStock")}</p>
            ) : (
              <div className="mt-4 divide-y divide-[#eee5e0] dark:divide-[#3a3431]">
                {data.lowStock.map((product) => (
                  <div key={product._id} className="py-4 text-sm">
                    <Link href={productsHref} className="font-semibold hover:text-[#a97872]">
                      {product.name[locale === "ar" ? "ar" : "en"]}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <span
                          key={variant._id}
                          className="rounded-lg bg-rose-50 px-2 py-1 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                          dir="auto"
                        >
                          {variant.sku} · {variant.size} ·{" "}
                          {t("unitsLeft", { count: variant.stock })}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.lowStockCount > data.lowStock.length && (
              <Link
                href={productsHref}
                className="mt-4 inline-block text-sm font-semibold text-[#a97872] dark:text-[#d4a39b]"
              >
                {t("moreLowStock", { count: data.lowStockCount - data.lowStock.length })}
              </Link>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
