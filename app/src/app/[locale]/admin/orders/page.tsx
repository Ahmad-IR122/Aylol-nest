import OrdersManager from "@/components/admin/orders/OrdersManager";
import { orderStatuses, type OrderStatus } from "@/lib/orders/status";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; order?: string }>;
}) {
  const { status, order } = await searchParams;
  const initialStatus = orderStatuses.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "";
  const initialOrderId =
    typeof order === "string" && /^[a-f\d]{24}$/i.test(order) ? order : undefined;
  return (
    <OrdersManager
      key={`${initialStatus}-${initialOrderId ?? ""}`}
      initialStatus={initialStatus}
      initialOrderId={initialOrderId}
    />
  );
}
