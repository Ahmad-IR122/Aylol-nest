import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { orderStatuses, type OrderStatus } from "@/lib/orders/status";

type Translator = ReturnType<typeof useTranslations<"AdminOrders">>;

export default function OrdersFilters({
  searchInput,
  status,
  t,
  onSearchChange,
  onStatusChange,
}: {
  searchInput: string;
  status: OrderStatus | "";
  t: Translator;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <section
      className="grid gap-4 rounded-2xl border border-[#eee5e0] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:p-5 dark:border-[#3a3431] dark:bg-[#292524]"
      aria-label={t("filters")}
    >
      <label className="block space-y-2 text-sm font-medium">
        <span>{t("search")}</span>
        <span className="relative block">
          <Search className="absolute start-3 top-3.5 size-4 text-[#817571]" aria-hidden="true" />
          <Input
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            maxLength={120}
            className="h-11 rounded-xl border-[#eee5e0] bg-transparent ps-10 dark:border-[#3a3431]"
          />
        </span>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>{t("statusFilter")}</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-[#eee5e0] bg-white px-3 text-sm dark:border-[#3a3431] dark:bg-[#211e1c]"
        >
          <option value="">{t("allStatuses")}</option>
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {t(`statuses.${value}`)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
