import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoryProductPage, categoryPageNumber } from "@/components/products/CategoryProductPage";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryProducts" });
  return { title: t("boys") };
}

export default async function BoysPage({ params, searchParams }: Props) {
  const [{ locale }, { page }] = await Promise.all([params, searchParams]);
  return <CategoryProductPage collection="boys" locale={locale} page={categoryPageNumber(page)} />;
}
