
import { getLocale } from "next-intl/server";
import CategoriesManager from "@/components/admin/categories/CategoriesManager";

export default async function CategoriesPage() {
  const locale = await getLocale();

  return <CategoriesManager locale={locale} />;
}
