import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AdminOrderSummary } from "@/types/admin-order";

import { statusClass } from "./order-utils";

type Translator = ReturnType<typeof useTranslations<"AdminOrders">>;

export default function OrdersTable({
  orders,
  t,
  currency,
  date,
  onOpen,
}: {
  orders: AdminOrderSummary[];
  t: Translator;
  currency: (value: number) => string;
  date: (value: string) => string;
  onOpen: (id: string) => Promise<void>;
}) {
  const columns = [
    "orderNumber",
    "customer",
    "phone",
    "date",
    "total",
    "paymentStatus",
    "orderStatus",
    "actions",
  ] as const;

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[820px] text-start text-sm">
        <thead className="bg-[#faf8f6] text-xs text-[#817571] dark:bg-[#211e1c] dark:text-[#aaa09b]">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-4 text-start font-medium">
                {t(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="border-t border-[#eee5e0] dark:border-[#3a3431]">
              <td className="px-4 py-4 font-semibold">
                <bdi>{order.orderNumber}</bdi>
              </td>
              <td className="px-4 py-4">{order.shippingAddress.fullName}</td>
              <td className="px-4 py-4">
                <bdi>{order.shippingAddress.phone}</bdi>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">{date(order.createdAt)}</td>
              <td className="px-4 py-4 whitespace-nowrap">
                <bdi>{currency(order.total)}</bdi>
              </td>
              <td className="px-4 py-4">{t(`paymentStatuses.${order.paymentStatus}`)}</td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}
                >
                  {t(`statuses.${order.status}`)}
                </span>
              </td>
              <td className="px-4 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10"
                  onClick={() => void onOpen(order._id)}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  {t("viewDetails")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
