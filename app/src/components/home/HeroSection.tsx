
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HeroSection() {
  const t = useTranslations("Home");

  return (
    <section className="relative overflow-hidden bg-[#F8F6F1] py-16 transition-colors duration-300 dark:bg-[#171512] md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
        {/* Hero Text */}
        <div className="order-1 space-y-6 text-center lg:order-2 lg:text-start">
          <span className="text-sm font-medium tracking-[0.2em] text-[#8A7B6B] dark:text-[#C9B8A4]">
            AYLOL NEST
          </span>

          <h1 className="text-4xl leading-[1.3] font-bold text-[#3B342D] dark:text-[#F8F6F1] md:text-5xl lg:text-6xl">
            {t("title")}
          </h1>

          <p className="mx-auto max-w-md text-base leading-8 text-[#8A7B6B] lg:mx-0 dark:text-[#C9B8A4]">
            {t("description")}
          </p>

          <Link
            href="/products"
            className="inline-flex rounded-full bg-[#3B342D] px-9 py-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#8A7B6B] dark:bg-[#E8DED4] dark:text-[#3B342D] dark:hover:bg-[#C9B8A4]"
          >
            {t("shopNow")}
          </Link>
        </div>

        {/* Hero Image */}
        <div className="order-2 lg:order-1">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="/images/home/hero.png"
              alt="Aylol Nest kids collection"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
