import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/home/FeaturedProducts";
import { Link } from "@/i18n/navigation";
import { getCategoryProducts } from "@/lib/products/storefront";
import type { HomeLocale } from "@/lib/home-data";

type Collection = "boys" | "girls";

export async function CategoryProductPage({
  collection,
  locale,
  page,
}: {
  collection: Collection;
  locale: string;
  page: number;
}) {
  const [data, t] = await Promise.all([
    getCategoryProducts(`${collection}-clothing`, page),
    getTranslations({ locale, namespace: "CategoryProducts" }),
  ]);
  const title = data.title?.[locale as HomeLocale] || t(collection);
  const basePath = `/${collection}`;
  const pageHref = (number: number) => (number === 1 ? basePath : `${basePath}?page=${number}`);

  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 text-[#3B342D] sm:px-6 md:py-20 dark:bg-[#171512] dark:text-[#F8F6F1]">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-10 text-3xl font-bold md:text-4xl">{title}</h1>
        {data.error || data.products.length === 0 ? (
          <p role="status" className="py-12 text-center text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t(data.error ? "loadError" : page > 1 ? "noPage" : "empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
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
                className="rounded-lg border border-[#C9B8A4] px-4 py-2 font-semibold hover:bg-[#F0E8DF] dark:hover:bg-[#302923]"
              >
                {t("previous")}
              </Link>
            )}
            <span className="text-sm">{t("pageOf", { page, total: data.totalPages })}</span>
            {page < data.totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-[#C9B8A4] px-4 py-2 font-semibold hover:bg-[#F0E8DF] dark:hover:bg-[#302923]"
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

export function categoryPageNumber(value: string | string[] | undefined) {
  return typeof value === "string" && /^[1-9]\d{0,5}$/.test(value) ? Number(value) : 1;
}
