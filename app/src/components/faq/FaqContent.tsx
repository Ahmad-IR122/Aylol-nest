"use client";

import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const questions = [
  "viewOrders",
  "regions",
  "fees",
  "payment",
  "sizes",
  "returnPolicy",
  "accountOrders",
] as const;

type Region = { slug: string; name: { ar: string; en: string }; shippingFee: number };

export default function FaqContent() {
  const t = useTranslations("FAQPage");
  const locale = useLocale() as "ar" | "en";
  const format = useFormatter();
  const [regions, setRegions] = useState<Region[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/shipping", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { regions: Region[] }) =>
        setRegions(
          data.regions.filter((region) => region && typeof region.shippingFee === "number"),
        ),
      )
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="mt-10">
      <div className="space-y-3">
        {questions.map((item) => (
          <details
            key={item}
            className="group rounded-xl border border-[#DCCFC1] bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900"
          >
            <summary className="cursor-pointer font-semibold marker:text-[#8A6B60] focus-visible:outline-2 focus-visible:outline-[#8A6B60]">
              {t(`questions.${item}`)}
            </summary>
            <div className="mt-4 leading-7 text-[#6F6255] dark:text-[#C9B8A4]">
              {item === "fees" ? (
                regions ? (
                  regions.length ? (
                    <ul className="list-inside list-disc">
                      {regions.map((region) => (
                        <li key={region.slug}>
                          {region.name[locale]}:{" "}
                          <bdi>
                            {format.number(region.shippingFee, {
                              style: "currency",
                              currency: "ILS",
                              currencyDisplay: "narrowSymbol",
                            })}
                          </bdi>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    t("feesUnavailable")
                  )
                ) : (
                  t("feesUnavailable")
                )
              ) : item === "viewOrders" || item === "accountOrders" ? (
                <>
                  <span>{t(`answers.${item}`)} </span>
                  <Link href="/orders" className="underline underline-offset-4">
                    {t("myOrdersLink")}
                  </Link>
                </>
              ) : item === "returnPolicy" ? (
                <>
                  <span>{t("answers.returnPolicy")} </span>
                  <Link href="/contact" className="underline underline-offset-4">
                    {t("contactLink")}
                  </Link>
                </>
              ) : (
                t(`answers.${item}`)
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
