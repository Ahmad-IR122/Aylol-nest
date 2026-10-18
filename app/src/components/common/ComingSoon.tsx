import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ComingSoon() {
  const locale = await getLocale();
  const t = await getTranslations("ComingSoon");

  const isArabic = locale === "ar";
  const Arrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#F8F6F1] px-6 py-20 text-center dark:bg-stone-950">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#E8DED4]/50 blur-3xl dark:bg-stone-800/30" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#DCC2B5]/30 blur-3xl dark:bg-stone-800/30" />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center">
        {/* Icon */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#E8DED4] bg-white/70 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <Sparkles size={32} strokeWidth={1.5} className="text-[#8A7B6B] dark:text-[#DCC2B5]" />
        </div>

        {/* Small heading */}
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#8A7B6B] uppercase dark:text-stone-400">
          {t("eyebrow")}
        </p>

        {/* Main title */}
        <h1 className="mb-6 text-5xl font-semibold tracking-tight text-[#3B342D] sm:text-6xl dark:text-stone-100">
          {t("title")}
        </h1>

        {/* Description */}
        <p className="mb-10 max-w-md text-base leading-8 text-[#8A7B6B] dark:text-stone-400">
          {t("description")}
        </p>

        {/* Home button */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#8A7B6B] px-8 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#6F6255] hover:shadow-lg"
        >
          <Arrow size={17} />
          {t("backHome")}
        </Link>

        {/* Decoration */}
        <div className="mt-12 flex items-center gap-4 text-[#DCC2B5]">
          <span className="h-px w-12 bg-[#DCC2B5]" />
          <Heart size={17} strokeWidth={1.5} />
          <span className="h-px w-12 bg-[#DCC2B5]" />
        </div>
      </div>
    </main>
  );
}
