import { getTranslations } from "next-intl/server";

import { orderStatuses, type OrderStatus as Status } from "@/lib/orders/status";

export async function OrderStatus({ status, locale }: { status: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "CustomerOrders" });
  const label = orderStatuses.includes(status as Status)
    ? t(`statuses.${status as Status}`)
    : status;
  return (
    <span className="inline-flex rounded-full bg-[#f8eeeb] px-3 py-1 text-xs font-semibold text-[#704c47] dark:bg-[#3b2d2b] dark:text-[#e4b7af]">
      {label}
    </span>
  );
}
