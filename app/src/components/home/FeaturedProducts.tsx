import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { homeCopy, homeProducts, type HomeLocale, type HomeProduct } from "@/lib/home-data";

export function ProductCard({ product }: { product: HomeProduct }) {
  const locale = useLocale() as HomeLocale;
  const t = homeCopy[locale];

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F0E8DF] dark:bg-[#302923]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name[locale]}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
            <span aria-hidden="true" className="text-5xl text-[#B9A99B] dark:text-[#877565]">
              ✿
            </span>
            <span className="text-xs text-[#8A7B6B] dark:text-[#C9B8A4]">{t.imagePlaceholder}</span>
          </div>
        )}

        {product.isNew && (
          <span className="absolute start-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3B342D] shadow-sm dark:bg-[#3B342D] dark:text-white">
            {t.newBadge}
          </span>
        )}
      </div>

      <div className="pt-4">
        <h3 className="text-sm font-semibold text-[#3B342D] md:text-base dark:text-[#F8F6F1]">
          {product.name[locale]}
        </h3>

        <p className="mt-2 font-bold text-[#8A7B6B] dark:text-[#C9B8A4]">
          {product.price} {t.currency}
        </p>
      </div>
    </article>
  );
}

export default function FeaturedProducts() {
  const locale = useLocale() as HomeLocale;
  const t = homeCopy[locale];

  return (
    <section className="bg-[#F8F6F1] px-6 py-20 md:py-24 dark:bg-[#171512]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#8A7B6B] dark:text-[#C9B8A4]">
              {t.featuredEyebrow}
            </p>

            <h2 className="text-3xl font-bold text-[#3B342D] md:text-4xl dark:text-[#F8F6F1]">
              {t.featuredTitle}
            </h2>

            <p className="mt-3 text-[#8A7B6B] dark:text-[#C9B8A4]">{t.featuredDescription}</p>
          </div>

          <Link
            href={`/${locale}/products`}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[#3B342D] underline underline-offset-4 dark:text-[#E8DED4]"
          >
            {t.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {homeProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
