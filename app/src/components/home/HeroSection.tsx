
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HeroSection() {
  const t = useTranslations("Home");

  return (
    <section className="relative flex min-h-[580px] items-center overflow-hidden bg-[#F8F6F1] px-6 py-16 transition-colors duration-300 dark:bg-[#171512] md:min-h-[680px] md:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6 text-center lg:text-start">
          <span className="inline-block text-sm font-semibold tracking-widest text-[#8A7B6B] dark:text-[#C9B8A4]">
            AYLOL NEST
          </span>

          <h1 className="text-4xl leading-tight font-bold text-[#3B342D] dark:text-[#F8F6F1] md:text-5xl lg:text-6xl">
            {t("title")}
          </h1>

          <p className="mx-auto max-w-lg text-base leading-8 text-[#8A7B6B] dark:text-[#C9B8A4] lg:mx-0">
            {t("description")}
          </p>

          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-[#3B342D] px-9 py-4 font-semibold text-white transition-colors hover:bg-[#8A7B6B] dark:bg-[#E8DED4] dark:text-[#3B342D] dark:hover:bg-[#C9B8A4]"
          >
            {t("shopNow")}
          </Link>
        </div>

        <div className="relative flex min-h-[380px] items-center justify-center rounded-[2rem] bg-[#E8DED4] transition-colors duration-300 dark:bg-[#2A2520] md:min-h-[500px]">
          <div className="text-center text-[#8A7B6B] dark:text-[#C9B8A4]">
            <p className="text-lg font-semibold">Aylol Nest</p>
            <p className="mt-2 text-sm">Hero Collection Image</p>
          </div>
        </div>
      </div>
    </section>
  );
}
