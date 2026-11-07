import { getLocale } from "next-intl/server";
import ShippingManager from "@/components/admin/shipping/ShippingManager";

export default async function ShippingPage() {
  return <ShippingManager locale={await getLocale()} />;
}
