import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AdminOrderSummary } from "@/types/admin-order";

import { statusClass } from "./order-utils";

type Translator = ReturnType<typeof useTranslations<"AdminOrders">>;

export default function OrderCard({
  order,
  t,
  currency,
  date,
  onOpen,
}: {
  order: AdminOrderSummary;
  t: Translator;
  currency: (value: number) => string;
  date: (value: string) => string;
  onOpen: (id: string) => Promise<void>;
}) {
  return (
    <article className="rounded-xl border border-[#eee5e0] p-4 text-sm dark:border-[#3a3431]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">
          <bdi>{order.orderNumber}</bdi>
        </p>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${statusClass(order.status)}`}
        >
          {t(`statuses.${order.status}`)}
        </span>
      </div>
      <p className="mt-3">
        {order.shippingAddress.fullName} · <bdi>{order.shippingAddress.phone}</bdi>
      </p>
      <p className="mt-1 text-[#817571] dark:text-[#aaa09b]">{date(order.createdAt)}</p>
      <p className="mt-2 font-semibold">
        <bdi>{currency(order.total)}</bdi> · {t(`paymentStatuses.${order.paymentStatus}`)}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 min-h-11 w-full"
        onClick={() => void onOpen(order._id)}
      >
        <Eye className="size-4" aria-hidden="true" />
        {t("viewDetails")}
      </Button>
    </article>
  );
}
