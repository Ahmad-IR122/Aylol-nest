import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ExchangePolicy" });
  return { title: t("title") };
}

export default async function ExchangePolicyPage() {
  const t = await getTranslations("ExchangePolicy");

  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 text-[#3B342D] sm:px-6 md:py-20 dark:bg-[#171512] dark:text-[#F8F6F1]">
      <div className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p>{t("intro")}</p>
        <p>{t("details")}</p>
        <Link href="/contact" className="inline-flex min-h-11 items-center underline underline-offset-4">
          {t("contact")}
        </Link>
      </div>
    </main>
  );
}
