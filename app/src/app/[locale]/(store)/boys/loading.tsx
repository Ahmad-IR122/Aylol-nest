import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("CategoryProducts");
  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 sm:px-6 md:py-20 dark:bg-[#171512]">
      <div className="mx-auto max-w-7xl animate-pulse" role="status" aria-label={t("loading")}>
        <div className="mb-10 h-10 w-48 rounded bg-[#E6DCD1] dark:bg-[#302923]" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-[4/5] rounded-2xl bg-[#E6DCD1] dark:bg-[#302923]" />
          ))}
        </div>
      </div>
    </main>
  );
}
