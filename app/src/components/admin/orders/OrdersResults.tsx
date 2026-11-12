import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AdminOrderList } from "@/types/admin-order";

import OrderCard from "./OrderCard";
import OrdersPagination from "./OrdersPagination";
import OrdersTable from "./OrdersTable";
import type { OrderErrorCode } from "./order-utils";

type Translator = ReturnType<typeof useTranslations<"AdminOrders">>;

export default function OrdersResults({
  list,
  loading,
  error,
  filtered,
  page,
  t,
  currency,
  date,
  onOpen,
  onRetry,
  onPageChange,
}: {
  list: AdminOrderList | null;
  loading: boolean;
  error: OrderErrorCode | null;
  filtered: boolean;
  page: number;
  t: Translator;
  currency: (value: number) => string;
  date: (value: string) => string;
  onOpen: (id: string) => Promise<void>;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
      >
        {t(`errors.${error}`)}{" "}
        <Button variant="outline" className="ms-3 min-h-10" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 py-12 text-sm text-[#817571] dark:text-[#aaa09b]"
      >
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        {t("loading")}
      </p>
    );
  }

  if (!list) return null;

  if (list.orders.length === 0) {
    return (
      <div className="rounded-2xl border border-[#eee5e0] bg-white p-12 text-center dark:border-[#3a3431] dark:bg-[#292524]">
        <p>{t(filtered ? "noResults" : "empty")}</p>
      </div>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]"
      aria-label={t("title")}
    >
      <div className="space-y-3 p-4 lg:hidden">
        {list.orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            t={t}
            currency={currency}
            date={date}
            onOpen={onOpen}
          />
        ))}
      </div>
      <OrdersTable orders={list.orders} t={t} currency={currency} date={date} onOpen={onOpen} />
      <OrdersPagination
        page={page}
        total={list.pagination.total}
        totalPages={list.pagination.totalPages}
        t={t}
        onPageChange={onPageChange}
      />
    </section>
  );
}
