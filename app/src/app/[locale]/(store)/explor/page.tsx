import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/home/FeaturedProducts";
import { Link } from "@/i18n/navigation";
import { categoryPageNumber } from "@/components/products/CategoryProductPage";
import { getExploreProducts } from "@/lib/products/storefront";

type Params = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Params> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Explore" });
  return { title: t("title") };
}

export default async function ExplorePage({ params, searchParams }: Props) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Explore"),
  ]);
  const page = categoryPageNumber(query.page);
  const data = await getExploreProducts({ page }, locale === "en" ? "en" : "ar");
  const pageHref = (page: number) => (page > 1 ? `/explor?page=${page}` : "/explor");

  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 text-[#3B342D] sm:px-6 md:py-20 dark:bg-[#171512] dark:text-[#F8F6F1]">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-[#8A7B6B] dark:text-[#C9B8A4]">{t("description")}</p>
        {data.error || data.products.length === 0 ? (
          <p role="status" className="py-12 text-center text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t(data.error ? "loadError" : page > 1 ? "noPage" : "empty")}
          </p>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {!data.error && data.totalPages > 1 && (
          <nav
            aria-label={t("pagination")}
            className="mt-12 flex items-center justify-center gap-4"
          >
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-[#C9B8A4] px-4 py-2"
              >
                {t("previous")}
              </Link>
            )}
            <span>{t("pageOf", { page, total: data.totalPages })}</span>
            {page < data.totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-[#C9B8A4] px-4 py-2"
              >
                {t("next")}
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
