import { getTranslations } from "next-intl/server";

export default async function AdminDashboardLoading() {
  const t = await getTranslations("AdminDashboard");
  return (
    <main className="min-h-screen bg-[#faf8f6] px-5 py-8 dark:bg-[#171717]" aria-busy="true">
      <div className="mx-auto max-w-7xl space-y-6">
        <p className="text-sm text-[#817571] dark:text-[#aaa09b]">{t("loading")}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-[#eee5e0] dark:bg-[#292524]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
