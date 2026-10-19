import Link from "next/link";
import { useLocale } from "next-intl";
import { homeCopy, type HomeLocale } from "@/lib/home-data";

export default function CategorySection() {
  const locale = useLocale() as HomeLocale;
  const t = homeCopy[locale];

  const categories = [
    {
      id: "girls",
      title: t.girls,
      icon: "✿",
      background: "bg-[#F2DFDC] dark:bg-[#49332F]",
      accent: "text-[#B4777B] dark:text-[#E7B9BB]",
    },
    {
      id: "boys",
      title: t.boys,
      icon: "✦",
      background: "bg-[#DFE8E4] dark:bg-[#2B4039]",
      accent: "text-[#719789] dark:text-[#A9CEBF]",
    },
    {
      id: "baby",
      title: t.baby,
      icon: "♡",
      background: "bg-[#F0E6D6] dark:bg-[#45392C]",
      accent: "text-[#B79A74] dark:text-[#E4CBA5]",
    },
  ];

  return (
    <section className="bg-white px-6 py-20 md:py-24 dark:bg-[#1C1916]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#8A7B6B] dark:text-[#C9B8A4]">
            {t.categoriesEyebrow}
          </p>

          <h2 className="text-3xl font-bold text-[#3B342D] md:text-4xl dark:text-[#F8F6F1]">
            {t.categoriesTitle}
          </h2>

          <p className="mt-4 text-[#8A7B6B] dark:text-[#C9B8A4]">{t.categoriesDescription}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/products?category=${category.id}`}
              className={`group relative flex min-h-[330px] flex-col items-center justify-center overflow-hidden rounded-[2rem] p-8 text-center transition-transform duration-300 hover:-translate-y-1 ${category.background}`}
            >
              <span
                aria-hidden="true"
                className={`mb-6 text-8xl transition-transform duration-300 group-hover:scale-110 ${category.accent}`}
              >
                {category.icon}
              </span>

              <h3 className="text-2xl font-bold text-[#3B342D] dark:text-[#F8F6F1]">
                {category.title}
              </h3>

              <span className="mt-6 text-sm font-semibold text-[#3B342D] underline-offset-4 group-hover:underline dark:text-[#F8F6F1]">
                {t.categoryAction} ↗
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
