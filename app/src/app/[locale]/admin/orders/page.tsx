import OrdersManager from "@/components/admin/orders/OrdersManager";
import { orderStatuses, type OrderStatus } from "@/lib/orders/status";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initialStatus = orderStatuses.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "";
  return <OrdersManager key={initialStatus} initialStatus={initialStatus} />;
}
