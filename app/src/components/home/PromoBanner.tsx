import Link from "next/link";
import { useLocale } from "next-intl";
import { homeCopy, type HomeLocale } from "@/lib/home-data";

export default function PromoBanner() {
  const locale = useLocale() as HomeLocale;
  const t = homeCopy[locale];

  return (
    <section className="bg-white px-6 py-12 md:py-20 dark:bg-[#1C1916]">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#E8DED4] dark:bg-[#302821]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-24 -top-32 h-96 w-96 rounded-full border-[65px] border-[#C9B8A4]/30 dark:border-[#8A7B6B]/20"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -start-24 -bottom-32 h-80 w-80 rounded-full bg-[#DCC2B5]/40 blur-3xl dark:bg-[#8A7B6B]/20"
        />

        <div className="relative mx-auto flex min-h-[380px] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
          <span className="mb-5 text-xs font-semibold tracking-[0.25em] text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t.bannerEyebrow}
          </span>

          <h2 className="text-3xl leading-relaxed font-bold text-[#3B342D] md:text-5xl dark:text-[#F8F6F1]">
            {t.bannerTitle}
          </h2>

          <p className="mt-5 max-w-lg leading-8 text-[#76685B] dark:text-[#C9B8A4]">
            {t.bannerDescription}
          </p>

          <Link
            href={`/${locale}/products`}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#3B342D] px-9 font-semibold text-white transition-colors hover:bg-[#65564A] dark:bg-[#E8DED4] dark:text-[#3B342D] dark:hover:bg-[#C9B8A4]"
          >
            {t.bannerAction}
          </Link>
        </div>
      </div>
    </section>
  );
}
