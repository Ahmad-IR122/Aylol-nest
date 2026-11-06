"use client";

import { useTranslations } from "next-intl";

export default function CustomersError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("AdminCustomers");
  return (
    <main className="p-5 md:p-8">
      <div
        role="alert"
        className="mx-auto max-w-7xl rounded-2xl border border-rose-200 bg-white p-6 dark:border-rose-900 dark:bg-[#292524]"
      >
        <p>{t("loadError")}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-[#a97872] px-4 py-2 text-white dark:bg-[#d4a39b] dark:text-[#171717]"
        >
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
