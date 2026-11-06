import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { listCustomers, parseCustomerFilters, type CustomerSummary } from "@/lib/admin/customers";

type SearchParams = Promise<{
  search?: string | string[];
  status?: string | string[];
  page?: string | string[];
}>;

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const [{ locale }, rawFilters, t, format] = await Promise.all([
    params,
    searchParams,
    getTranslations("AdminCustomers"),
    getFormatter(),
  ]);
  const filters = parseCustomerFilters(rawFilters);
  const { customers, total, totalPages } = await listCustomers(filters);
  const date = (value: Date) =>
    format.dateTime(value, { dateStyle: "medium", timeZone: "Asia/Hebron" });
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.status) query.set("status", filters.status);
    query.set("page", String(page));
    return `/${locale}/admin/customers?${query}`;
  };

  return (
    <main className="min-w-0 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        </header>
        <form
          action={`/${locale}/admin/customers`}
          method="get"
          className="grid gap-4 rounded-2xl border border-[#eee5e0] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end sm:p-5 dark:border-[#3a3431] dark:bg-[#292524]"
        >
          <label className="space-y-2 text-sm font-medium">
            <span className="block">{t("search")}</span>
            <input
              name="search"
              type="search"
              defaultValue={filters.search}
              maxLength={120}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-transparent px-3 dark:border-[#3a3431]"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span className="block">{t("statusFilter")}</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-white px-3 dark:border-[#3a3431] dark:bg-[#211e1c]"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </label>
          <button
            type="submit"
            className="h-11 rounded-xl bg-[#a97872] px-5 font-medium text-white dark:bg-[#d4a39b] dark:text-[#171717]"
          >
            {t("apply")}
          </button>
        </form>

        {customers.length === 0 ? (
          <div className="rounded-2xl border border-[#eee5e0] bg-white p-12 text-center dark:border-[#3a3431] dark:bg-[#292524]">
            {t(filters.search || filters.status || total > 0 ? "noResults" : "empty")}
          </div>
        ) : (
          <section
            aria-label={t("title")}
            className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]"
          >
            <div className="space-y-3 p-4 lg:hidden">
              {customers.map((customer) => (
                <CustomerCard
                  key={String(customer._id)}
                  customer={customer}
                  locale={locale}
                  t={t}
                  date={date}
                  money={money}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[#faf8f6] text-xs text-[#817571] dark:bg-[#211e1c] dark:text-[#aaa09b]">
                  <tr>
                    {(
                      [
                        "name",
                        "email",
                        "phone",
                        "registered",
                        "totalOrders",
                        "totalSpent",
                        "status",
                        "action",
                      ] as const
                    ).map((key) => (
                      <th key={key} scope="col" className="px-4 py-4 text-start font-medium">
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={String(customer._id)}
                      className="border-t border-[#eee5e0] dark:border-[#3a3431]"
                    >
                      <td className="px-4 py-4 font-semibold">
                        {customerName(customer, t("unnamed"))}
                      </td>
                      <td className="px-4 py-4 wrap-anywhere">
                        <bdi>{customer.email}</bdi>
                      </td>
                      <td className="px-4 py-4">
                        <bdi>{customer.phone || "—"}</bdi>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{date(customer.createdAt)}</td>
                      <td className="px-4 py-4">{customer.totalOrders}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <bdi>{money(customer.totalSpent)}</bdi>
                      </td>
                      <td className="px-4 py-4">
                        <Status active={customer.isActive} t={t} />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          className="inline-flex min-h-10 items-center rounded-xl border border-[#eee5e0] px-3 font-medium hover:bg-[#faf8f6] dark:border-[#3a3431] dark:hover:bg-[#332d2a]"
                          href={`/${locale}/admin/customers/${customer._id}`}
                        >
                          {t("viewDetails")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5e0] px-4 py-4 text-sm dark:border-[#3a3431]">
              <p>{t("results", { count: total })}</p>
              <nav aria-label={t("pagination")} className="flex items-center gap-3">
                {filters.page > 1 && (
                  <Link
                    href={pageHref(filters.page - 1)}
                    className="rounded-lg border px-3 py-2 dark:border-[#3a3431]"
                  >
                    {t("previous")}
                  </Link>
                )}
                <span>{t("pageOf", { page: filters.page, total: Math.max(1, totalPages) })}</span>
                {filters.page < totalPages && (
                  <Link
                    href={pageHref(filters.page + 1)}
                    className="rounded-lg border px-3 py-2 dark:border-[#3a3431]"
                  >
                    {t("next")}
                  </Link>
                )}
              </nav>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function customerName(customer: Pick<CustomerSummary, "firstName" | "lastName">, fallback: string) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || fallback;
}

function Status({
  active,
  t,
}: {
  active: boolean;
  t: Awaited<ReturnType<typeof getTranslations<"AdminCustomers">>>;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"}`}
    >
      {t(active ? "active" : "inactive")}
    </span>
  );
}

function CustomerCard({
  customer,
  locale,
  t,
  date,
  money,
}: {
  customer: CustomerSummary;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"AdminCustomers">>>;
  date: (value: Date) => string;
  money: (value: number) => string;
}) {
  return (
    <article className="rounded-xl border border-[#eee5e0] p-4 dark:border-[#3a3431]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-semibold">{customerName(customer, t("unnamed"))}</h2>
        <Status active={customer.isActive} t={t} />
      </div>
      <p className="mt-2 text-sm wrap-anywhere">
        <bdi>{customer.email}</bdi>
      </p>
      <p className="mt-1 text-sm">
        <bdi>{customer.phone || "—"}</bdi>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-[#817571] dark:text-[#aaa09b]">{t("registered")}</dt>
          <dd>{date(customer.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-[#817571] dark:text-[#aaa09b]">{t("totalOrders")}</dt>
          <dd>{customer.totalOrders}</dd>
        </div>
        <div>
          <dt className="text-[#817571] dark:text-[#aaa09b]">{t("totalSpent")}</dt>
          <dd>
            <bdi>{money(customer.totalSpent)}</bdi>
          </dd>
        </div>
      </dl>
      <Link
        href={`/${locale}/admin/customers/${customer._id}`}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#eee5e0] font-medium dark:border-[#3a3431]"
      >
        {t("viewDetails")}
      </Link>
    </article>
  );
}
