"use client";

import { useTranslations } from "next-intl";

export default function AdminDashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("AdminDashboard");
  return (
    <main className="min-h-dvh bg-[#faf8f6] px-5 py-10 dark:bg-[#171717]">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#eee5e0] bg-white p-6 dark:border-[#3a3431] dark:bg-[#292524]">
        <h1 className="text-xl font-bold">{t("error")}</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-[#a97872] px-5 py-3 text-sm font-semibold text-white hover:bg-[#93635d]"
        >
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
