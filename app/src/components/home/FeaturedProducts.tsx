import { useFormatter, useLocale, useTranslations } from "next-intl";
import ProductImage from "@/components/home/ProductImage";
import { Link } from "@/i18n/navigation";
import type { HomeLocale, HomeProduct } from "@/lib/home-data";
import type { StorefrontProducts } from "@/lib/products/storefront";

export function ProductCard({ product }: { product: HomeProduct }) {
  const locale = useLocale() as HomeLocale;
  const t = useTranslations("StorefrontProducts");
  const format = useFormatter();
  const price =
    product.price === null
      ? null
      : format.number(product.price, {
          style: "currency",
          currency: "ILS",
          currencyDisplay: "narrowSymbol",
        });

  return (
    <article className="group min-w-0">
      <Link
        href={`/products/${product.slug}`}
        className="block rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#a97872] dark:focus-visible:outline-[#d4a39b]"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F0E8DF] dark:bg-[#302923]">
          <ProductImage
            src={product.image}
            alt={product.imageAlt[locale] || product.name[locale]}
            placeholder={t("imagePlaceholder")}
          />

          {product.isNew && (
            <span className="absolute start-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3B342D] shadow-sm dark:bg-[#3B342D] dark:text-white">
              {t("newBadge")}
            </span>
          )}
        </div>

        <div className="pt-4">
          <h3 className="text-sm font-semibold wrap-anywhere text-[#3B342D] md:text-base dark:text-[#F8F6F1]">
            {product.name[locale]}
          </h3>

          {product.category && (
            <p className="mt-1 text-xs wrap-anywhere text-[#8A7B6B] dark:text-[#C9B8A4]">
              {product.category[locale]}
            </p>
          )}

          <p className="mt-2 font-bold text-[#8A7B6B] dark:text-[#C9B8A4]">
            <bdi>
              {price === null
                ? t("priceUnavailable")
                : product.maxPrice !== product.price
                  ? t("fromPrice", { price })
                  : price}
            </bdi>
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${product.inStock ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200" : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"}`}
          >
            {t(product.inStock ? "inStock" : "outOfStock")}
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function FeaturedProducts({ products, error }: StorefrontProducts) {
  const t = useTranslations("StorefrontProducts");

  return (
    <section className="bg-[#F8F6F1] px-6 py-20 md:py-24 dark:bg-[#171512]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-semibold text-[#8A7B6B] ltr:tracking-[0.2em] dark:text-[#C9B8A4]">
              {t("featuredEyebrow")}
            </p>

            <h2 className="text-3xl font-bold text-[#3B342D] md:text-4xl dark:text-[#F8F6F1]">
              {t("featuredTitle")}
            </h2>

            <p className="mt-3 text-[#8A7B6B] dark:text-[#C9B8A4]">{t("featuredDescription")}</p>
          </div>
        </div>

        {error || products.length === 0 ? (
          <p role="status" className="py-8 text-center text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t(error ? "loadError" : "empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
