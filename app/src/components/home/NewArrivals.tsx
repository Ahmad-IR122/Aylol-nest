import Link from "next/link";
import { useLocale } from "next-intl";
import { ProductCard } from "@/components/home/FeaturedProducts";
import { homeCopy, homeProducts, type HomeLocale } from "@/lib/home-data";

export default function NewArrivals() {
  const locale = useLocale() as HomeLocale;
  const t = homeCopy[locale];

  const newProducts = homeProducts.filter((product) => product.isNew);

  return (
    <section className="bg-white px-6 py-20 md:py-24 dark:bg-[#1C1916]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t.arrivalsEyebrow}
          </p>

          <h2 className="text-3xl font-bold text-[#3B342D] md:text-4xl dark:text-[#F8F6F1]">
            {t.arrivalsTitle}
          </h2>

          <p className="mt-4 text-[#8A7B6B] dark:text-[#C9B8A4]">{t.arrivalsDescription}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={`/${locale}/products`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#C9B8A4] px-8 font-semibold text-[#3B342D] transition-colors hover:bg-[#F8F6F1] dark:border-[#8A7B6B] dark:text-[#F8F6F1] dark:hover:bg-[#302821]"
          >
            {t.viewAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
