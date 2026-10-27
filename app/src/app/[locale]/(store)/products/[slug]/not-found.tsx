import { PackageSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ProductNotFound() {
  const t = await getTranslations("ProductDetails");
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#faf8f6] px-6 py-16 text-center text-[#352d2b] dark:bg-[#171717] dark:text-[#f5efec]">
      <PackageSearch
        className="mb-6 size-12 text-[#a97872] dark:text-[#d4a39b]"
        aria-hidden="true"
      />
      <p className="text-sm text-[#817571] dark:text-[#aaa09b]">404</p>
      <h1 className="mt-3 text-3xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-4 max-w-md leading-7 text-[#817571] dark:text-[#aaa09b]">
        {t("notFoundDescription")}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[#a97872] px-6 py-3 font-semibold text-white dark:bg-[#d4a39b] dark:text-[#171717]"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
