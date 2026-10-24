"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  onLanguageChange?: () => void;
};

export function LanguageSwitcher({ onLanguageChange }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const changeLanguage = () => {
    router.replace(pathname, {
      locale: locale === "ar" ? "en" : "ar",
    });

    onLanguageChange?.();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={changeLanguage}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="min-h-11 min-w-11 px-2 font-bold lg:min-h-7 lg:min-w-0 lg:px-2.5"
    >
      {locale === "ar" ? "EN" : "عربي"}
    </Button>
  );
}
