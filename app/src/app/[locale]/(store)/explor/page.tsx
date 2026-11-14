import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/home/FeaturedProducts";
import { Link } from "@/i18n/navigation";
import { categoryPageNumber } from "@/components/products/CategoryProductPage";
import { getExploreProducts, type ExploreFilters } from "@/lib/products/storefront";

type Params = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Params> };
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const price = (value: string) =>
  value !== "" && /^\d+(?:\.\d{1,2})?$/.test(value) ? Number(value) : undefined;

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
  const filters: ExploreFilters = {
    page: categoryPageNumber(query.page),
    search: one(query.search).slice(0, 200),
    category: one(query.category),
    minPrice: price(one(query.minPrice)),
    maxPrice: price(one(query.maxPrice)),
    size: one(query.size).slice(0, 80),
    color: one(query.color).slice(0, 80),
    availability:
      one(query.availability) === "in"
        ? "in"
        : one(query.availability) === "out"
          ? "out"
          : undefined,
    sort: (["selected", "newest", "priceAsc", "priceDesc", "name"].includes(one(query.sort))
      ? one(query.sort)
      : "selected") as ExploreFilters["sort"],
  };
  const data = await getExploreProducts(filters, locale === "en" ? "en" : "ar");
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key !== "page" && typeof value === "string" && value) params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    return `/explor${params.size ? `?${params}` : ""}`;
  };
  const field =
    "min-h-11 w-full rounded-xl border border-[#C9B8A4] bg-white px-3 py-2 text-sm text-[#3B342D] dark:bg-[#302923] dark:text-[#F8F6F1]";

  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 text-[#3B342D] sm:px-6 md:py-20 dark:bg-[#171512] dark:text-[#F8F6F1]">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-[#8A7B6B] dark:text-[#C9B8A4]">{t("description")}</p>
        <form
          action={`/${locale}/explor`}
          method="get"
          className="my-9 grid gap-3 rounded-2xl border border-[#C9B8A4]/40 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-sm">
            {t("search")}
            <input
              className={field}
              name="search"
              type="search"
              defaultValue={filters.search}
              maxLength={200}
            />
          </label>
          <label className="text-sm">
            {t("category")}
            <select className={field} name="category" defaultValue={filters.category}>
              <option value="">{t("allCategories")}</option>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name[locale === "en" ? "en" : "ar"]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t("minPrice")}
            <input
              className={field}
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={one(query.minPrice)}
            />
          </label>
          <label className="text-sm">
            {t("maxPrice")}
            <input
              className={field}
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={one(query.maxPrice)}
            />
          </label>
          <label className="text-sm">
            {t("size")}
            <input className={field} name="size" defaultValue={filters.size} maxLength={80} />
          </label>
          <label className="text-sm">
            {t("color")}
            <input className={field} name="color" defaultValue={filters.color} maxLength={80} />
          </label>
          <label className="text-sm">
            {t("availability")}
            <select className={field} name="availability" defaultValue={filters.availability ?? ""}>
              <option value="">{t("all")}</option>
              <option value="in">{t("inStock")}</option>
              <option value="out">{t("outOfStock")}</option>
            </select>
          </label>
          <label className="text-sm">
            {t("sort")}
            <select className={field} name="sort" defaultValue={filters.sort}>
              <option value="selected">{t("selectedOrder")}</option>
              <option value="newest">{t("newest")}</option>
              <option value="priceAsc">{t("priceAsc")}</option>
              <option value="priceDesc">{t("priceDesc")}</option>
              <option value="name">{t("name")}</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button
              className="min-h-11 rounded-xl bg-[#a97872] px-5 font-semibold text-white dark:bg-[#d4a39b] dark:text-[#171512]"
              type="submit"
            >
              {t("apply")}
            </button>
            <Link className="px-3 py-3 underline" href="/explor">
              {t("clear")}
            </Link>
          </div>
        </form>
        {data.error || data.products.length === 0 ? (
          <p role="status" className="py-12 text-center text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t(data.error ? "loadError" : filters.page > 1 ? "noPage" : "empty")}
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
            {filters.page > 1 && (
              <Link
                href={pageHref(filters.page - 1)}
                className="rounded-lg border border-[#C9B8A4] px-4 py-2"
              >
                {t("previous")}
              </Link>
            )}
            <span>{t("pageOf", { page: filters.page, total: data.totalPages })}</span>
            {filters.page < data.totalPages && (
              <Link
                href={pageHref(filters.page + 1)}
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
