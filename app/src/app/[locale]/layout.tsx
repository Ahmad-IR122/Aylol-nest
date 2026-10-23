
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cairo } from "next/font/google";

import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppClerkProvider } from "@/components/providers/clerk-provider";

import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return {
    title: {
      default: isArabic
        ? "ايلول نيست | ملابس أطفال"
        : "Aylol Nest | Kids Clothing",
      template: isArabic
        ? "%s | ايلول نيست"
        : "%s | Aylol Nest",
    },
    description: isArabic
      ? "ايلول نيست — ملابس جميلة ومريحة للأولاد والبنات، من حديثي الولادة حتى عمر 14 سنة."
      : "Aylol Nest — Beautiful clothing for boys and girls, from newborn to 14 years old.",
    applicationName: isArabic ? "ايلول نيست" : "Aylol Nest",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body className={`${cairo.variable} min-h-screen font-sans`}>
        <AppClerkProvider locale={locale}>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </AppClerkProvider>
      </body>
    </html>
  );
}
