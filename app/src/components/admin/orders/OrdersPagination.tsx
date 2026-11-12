import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type Translator = ReturnType<typeof useTranslations<"AdminOrders">>;

export default function OrdersPagination({
  page,
  total,
  totalPages,
  t,
  onPageChange,
}: {
  page: number;
  total: number;
  totalPages: number;
  t: Translator;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5e0] px-4 py-4 text-sm dark:border-[#3a3431]">
      <p>{t("results", { count: total })}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("previous")}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="min-h-11 min-w-11"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>
        <span>{t("pageOf", { page, total: Math.max(1, totalPages) })}</span>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("next")}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="min-h-11 min-w-11"
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
