import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/home/FeaturedProducts";
import ProductDetails from "@/components/products/ProductDetails";
import { Link } from "@/i18n/navigation";
import type { HomeLocale } from "@/lib/home-data";
import { galleryImages } from "@/lib/products/selection";
import { getRelatedProducts, getStorefrontProduct } from "@/lib/products/storefront";

type Props = { params: Promise<{ locale: string; slug: string }> };

function appOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) {
      return url.origin;
    }
  } catch {
    // Omit canonical URLs until a real application URL is configured.
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const language: HomeLocale = locale === "ar" ? "ar" : "en";
  const title = product.name[language];
  const description = (product.description[language] || title)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const image = galleryImages(product.images, product.variants)[0];
  const origin = appOrigin();
  const canonical = origin ? `${origin}/${language}/products/${product.slug}` : undefined;
  return {
    title,
    description,
    alternates: canonical
      ? {
          canonical,
          languages: {
            ar: `${origin}/ar/products/${product.slug}`,
            en: `${origin}/en/products/${product.slug}`,
          },
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      locale: language === "ar" ? "ar_PS" : "en_US",
      url: canonical,
      images: image ? [{ url: image.url, alt: image.alt[language] || title }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const language: HomeLocale = locale === "ar" ? "ar" : "en";
  const [related, t, format] = await Promise.all([
    getRelatedProducts(product),
    getTranslations({ locale, namespace: "ProductDetails" }),
    getFormatter({ locale }),
  ]);
  const sizes = [...new Set(product.variants.map((variant) => variant.size))];
  const delivery = [
    { key: "westBank", fee: 20 },
    { key: "jerusalem", fee: 30 },
    { key: "inside48", fee: 70 },
  ] as const;
  const summaryClass =
    "flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-semibold marker:content-none [&::-webkit-details-marker]:hidden";

  return (
    <main className="min-h-dvh bg-[#faf8f6] px-4 pt-6 pb-16 text-[#352d2b] sm:px-6 lg:px-8 dark:bg-[#171717] dark:text-[#f5efec]">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label={t("breadcrumb")}
          className="mb-7 text-xs text-[#817571] sm:mb-10 dark:text-[#aaa09b]"
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline"
              >
                {t("home")}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3 rtl:rotate-180" />
            </li>
            <li
              aria-current="page"
              className="max-w-full wrap-anywhere text-[#352d2b] dark:text-[#f5efec]"
            >
              {product.name[language]}
            </li>
          </ol>
        </nav>

        <ProductDetails key={product.id} product={product} />

        <section
          aria-label={t("information")}
          className="mt-12 grid gap-7 border-t border-[#eee5e0] pt-8 lg:mt-20 lg:grid-cols-[1fr_2fr] lg:gap-20 lg:pt-12 dark:border-[#3a3431]"
        >
          <div>
            <p className="text-xs font-semibold text-[#a97872] ltr:tracking-[0.16em] dark:text-[#d4a39b]">
              AYLOL NEST
            </p>
            <h2 className="mt-3 text-2xl font-semibold">{t("information")}</h2>
          </div>
          <div className="min-w-0 divide-y divide-[#eee5e0] dark:divide-[#3a3431]">
            <details open className="group">
              <summary className={summaryClass}>
                {t("description")}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="pb-6 text-sm leading-8 wrap-anywhere whitespace-pre-line text-[#817571] dark:text-[#aaa09b]">
                {product.description[language] || t("noDescription")}
              </p>
            </details>
            <details className="group">
              <summary className={summaryClass}>
                {t("availableSizes")}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <div className="pb-6 text-sm text-[#817571] dark:text-[#aaa09b]">
                {sizes.length ? (
                  <>
                    <ul className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <li
                          key={size}
                          className="rounded-lg border border-[#eee5e0] px-3 py-2 dark:border-[#3a3431]"
                        >
                          <bdi>{size}</bdi>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 leading-7">{t("sizeAvailability")}</p>
                  </>
                ) : (
                  t("noVariants")
                )}
              </div>
            </details>
            <details id="delivery" className="group scroll-mt-28" open>
              <summary className={summaryClass}>
                {t("delivery")}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <div className="pb-6 text-sm text-[#817571] dark:text-[#aaa09b]">
                <dl className="space-y-3">
                  {delivery.map(({ key, fee }) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt>{t(key)}</dt>
                      <dd className="font-semibold text-[#352d2b] dark:text-[#f5efec]">
                        <bdi>
                          {format.number(fee, {
                            style: "currency",
                            currency: "ILS",
                            currencyDisplay: "narrowSymbol",
                          })}
                        </bdi>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 border-t border-[#eee5e0] pt-4 dark:border-[#3a3431]">
                  {t("cashOnDelivery")}
                </p>
              </div>
            </details>
          </div>
        </section>

        {(related.error || related.products.length > 0) && (
          <section
            aria-labelledby="related-title"
            className="mt-12 border-t border-[#eee5e0] pt-10 lg:mt-20 lg:pt-14 dark:border-[#3a3431]"
          >
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold text-[#817571] ltr:tracking-[0.16em] dark:text-[#aaa09b]">
                {t("relatedEyebrow")}
              </p>
              <h2 id="related-title" className="text-2xl font-semibold sm:text-3xl">
                {t("relatedTitle")}
              </h2>
            </div>
            {related.error ? (
              <p role="status" className="text-sm text-[#817571] dark:text-[#aaa09b]">
                {t("relatedError")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                {related.products.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
