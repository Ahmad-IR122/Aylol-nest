"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function ProductError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("ProductDetails");
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#faf8f6] px-6 py-16 text-center text-[#352d2b] dark:bg-[#171717] dark:text-[#f5efec]">
      <h1 className="text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="mt-4 max-w-md leading-7 text-[#817571] dark:text-[#aaa09b]">
        {t("errorDescription")}
      </p>
      <Button
        onClick={retry}
        className="mt-6 h-12 gap-2 rounded-xl bg-[#a97872] px-6 text-white hover:bg-[#91645e] dark:bg-[#d4a39b] dark:text-[#171717]"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        {t("retry")}
      </Button>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
