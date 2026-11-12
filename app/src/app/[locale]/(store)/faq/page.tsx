import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FaqContent from "@/components/faq/FaqContent";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQPage" });
  return { title: t("title") };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQPage" });
  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 text-[#3B342D] sm:px-6 md:py-20 dark:bg-[#171512] dark:text-[#F8F6F1]">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-[#8A7B6B] dark:text-[#C9B8A4]">{t("intro")}</p>
        <FaqContent />
      </div>
    </main>
  );
}
