import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/home/FeaturedProducts";
import type { StorefrontProducts } from "@/lib/products/storefront";

export default function NewArrivals({ products, error }: StorefrontProducts) {
  const t = useTranslations("StorefrontProducts");

  return (
    <section className="bg-white px-6 py-20 md:py-24 dark:bg-[#1C1916]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold text-[#8A7B6B] ltr:tracking-[0.2em] dark:text-[#C9B8A4]">
            {t("arrivalsEyebrow")}
          </p>

          <h2 className="text-3xl font-bold text-[#3B342D] md:text-4xl dark:text-[#F8F6F1]">
            {t("arrivalsTitle")}
          </h2>

          <p className="mt-4 text-[#8A7B6B] dark:text-[#C9B8A4]">{t("arrivalsDescription")}</p>
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
