import { Headset, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const benefits = [
  { key: "fastSupport", Icon: Headset },
  { key: "fastDelivery", Icon: Truck },
  { key: "cashOnDelivery", Icon: ShieldCheck },
  { key: "qualityProducts", Icon: PackageCheck },
] as const;

export default function StoreBenefits() {
  const t = useTranslations("StoreBenefits");

  return (
    <section
      aria-labelledby="store-benefits-title"
      className="bg-[#F8F6F1] px-4 py-5 sm:px-6 lg:py-7 dark:bg-[#1C1916]"
    >
      <h2 id="store-benefits-title" className="sr-only">
        {t("title")}
      </h2>
      <ul className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ key, Icon }, index) => (
          <li
            key={key}
            className={`flex min-w-0 items-start gap-3 px-3 py-4 sm:items-center sm:px-5 lg:px-6 ${index % 2 === 1 ? "border-s border-[#C9B8A4]/50 dark:border-[#8A7B6B]/50" : ""} ${index === 2 ? "lg:border-s lg:border-[#C9B8A4]/50 lg:dark:border-[#8A7B6B]/50" : ""} ${index >= 2 ? "border-t border-[#C9B8A4]/50 lg:border-t-0 dark:border-[#8A7B6B]/50" : ""}`}
          >
            <Icon
              aria-hidden="true"
              className="mt-0.5 size-6 shrink-0 text-[#8A7B6B] sm:mt-0 sm:size-7 dark:text-[#C9B8A4]"
              strokeWidth={1.7}
            />
            <div className="min-w-0">
              <h3 className="text-sm leading-snug font-bold text-[#3B342D] sm:text-base dark:text-[#F8F6F1]">
                {t(`${key}Title`)}
              </h3>
              <p className="mt-1 text-xs leading-snug text-[#76685B] sm:text-sm dark:text-[#C9B8A4]">
                {t(`${key}Subtitle`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
