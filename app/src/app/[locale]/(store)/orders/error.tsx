"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function OrdersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("CustomerOrders");
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#faf8f6] px-6 text-center text-[#352d2b] dark:bg-[#171717] dark:text-[#f5efec]">
      <h1 className="text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="mt-3 text-[#817571] dark:text-[#aaa09b]">{t("errorDescription")}</p>
      <Button onClick={reset} className="mt-6">
        {t("retry")}
      </Button>
    </main>
  );
}
