import Image from "next/image";
import { Shirt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function DressIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      <path d="M9 3 7 7l2 3-4 9c2 1.3 4.3 2 7 2s5-.7 7-2l-4-9 2-3-2-4-3 2-3-2Z" />
      <path d="M9 10h6" />
    </svg>
  );
}

export default function HeroSection() {
  const t = useTranslations("Home");
  const isArabic = useLocale() === "ar";

  return (
    <section className="bg-[#171512]">
      <div className="relative flex min-h-[680px] w-full items-end overflow-hidden bg-[#171512] px-6 pt-64 pb-10 sm:min-h-[720px] sm:px-10 md:px-12 lg:min-h-[650px] lg:items-center lg:px-16 lg:py-16 2xl:min-h-[760px] 2xl:px-24">
        <Image
          src="/images/home/hero-banner-mobile.webp"
          alt={t("heroImageAlt")}
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 1px"
          className="object-cover object-center lg:hidden"
        />
        <Image
          src="/images/home/hero-banner.webp"
          alt={t("heroImageAlt")}
          fill
          priority
          sizes="(min-width: 1024px) 100vw, 1px"
          className="hidden object-cover object-center lg:block"
          style={isArabic ? { transform: "scaleX(-1)" } : undefined}
        />
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-linear-to-t from-[#171512] via-[#171512]/80 via-35% to-transparent to-75% lg:from-[#171512]/95 lg:via-[#171512]/75 lg:via-40% lg:to-transparent lg:to-75% ${isArabic ? "lg:bg-linear-to-l" : "lg:bg-linear-to-r"}`}
        />

        <div className="relative z-10 w-full text-start lg:max-w-[620px]">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#E8DED4] sm:text-sm">
            AYLOL NEST
          </p>
          <h1 className="text-4xl leading-[1.12] font-bold text-white sm:text-5xl lg:text-[3.5rem]">
            <span className="block">{t("heroLine1")}</span>
            <span className="block">{t("heroLine2")}</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#E8DED4] sm:text-base">
            {t("heroDescription")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-7">
            <Link
              href="/boys"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#E8DED4] px-5 py-2.5 text-sm font-semibold text-[#3B342D] transition-colors hover:bg-[#C9B8A4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Shirt aria-hidden="true" className="size-5 shrink-0" />
              {t("shopBoys")}
            </Link>
            <Link
              href="/girls"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#E8DED4] bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <DressIcon />
              {t("shopGirls")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
