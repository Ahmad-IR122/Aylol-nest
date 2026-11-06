import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { getCustomer } from "@/lib/admin/customers";
import CustomerActions from "@/components/admin/customers/CustomerActions";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [{ locale, id }, t, ordersT, format] = await Promise.all([
    params,
    getTranslations("AdminCustomers"),
    getTranslations("AdminOrders"),
    getFormatter(),
  ]);
  const result = await getCustomer(id);
  if (!result) notFound();
  const { customer, recentOrders } = result;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || t("unnamed");
  const date = (value: Date) =>
    format.dateTime(value, { dateStyle: "medium", timeZone: "Asia/Hebron" });
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });

  return (
    <main className="min-w-0 p-5 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={`/${locale}/admin/customers`}
          className="text-sm font-medium text-[#a97872] dark:text-[#d4a39b]"
        >
          {t("backToCustomers")}
        </Link>
        <header>
          <h1 className="text-2xl font-semibold sm:text-3xl">{name}</h1>
          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">
            {t("detailsDescription")}
          </p>
        </header>
        <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 dark:border-[#3a3431] dark:bg-[#292524]">
          <h2 className="font-semibold">{t("profile")}</h2>
          <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
            <Info label={t("name")} value={name} />
            <Info label={t("email")} value={customer.email} />
            <Info label={t("phone")} value={customer.phone || "—"} />
            <Info label={t("registered")} value={date(customer.createdAt)} />
            <div>
              <dt className="text-[#817571] dark:text-[#aaa09b]">{t("status")}</dt>
              <dd className="mt-1">{t(customer.isActive ? "active" : "inactive")}</dd>
            </div>
          </dl>
        </section>
        <CustomerActions
          id={String(customer._id)}
          locale={locale}
          firstName={customer.firstName}
          lastName={customer.lastName}
          phone={customer.profilePhone}
          isActive={customer.isActive}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label={t("totalOrders")} value={String(customer.totalOrders)} />
          <Metric label={t("totalSpent")} value={money(customer.totalSpent)} />
        </div>
        <section className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]">
          <h2 className="p-5 font-semibold">{t("recentOrders")}</h2>
          {recentOrders.length === 0 ? (
            <p className="border-t border-[#eee5e0] p-5 text-sm dark:border-[#3a3431]">
              {t("noOrders")}
            </p>
          ) : (
            <ul>
              {recentOrders.map((order) => (
                <li
                  key={String(order._id)}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5e0] p-4 text-sm dark:border-[#3a3431]"
                >
                  <div>
                    <p className="font-semibold">
                      <bdi>{order.orderNumber}</bdi>
                    </p>
                    <p className="mt-1 text-[#817571] dark:text-[#aaa09b]">
                      {date(order.createdAt)} · {ordersT(`statuses.${order.status}`)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <bdi>{money(order.total)}</bdi>
                    <Link
                      href={`/${locale}/admin/orders?order=${order._id}`}
                      className="rounded-xl border border-[#eee5e0] px-3 py-2 font-medium dark:border-[#3a3431]"
                    >
                      {t("viewOrder")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[#817571] dark:text-[#aaa09b]">{label}</dt>
      <dd className="mt-1 wrap-anywhere">
        <bdi>{value}</bdi>
      </dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eee5e0] bg-white p-5 dark:border-[#3a3431] dark:bg-[#292524]">
      <p className="text-sm text-[#817571] dark:text-[#aaa09b]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">
        <bdi>{value}</bdi>
      </p>
    </div>
  );
}
