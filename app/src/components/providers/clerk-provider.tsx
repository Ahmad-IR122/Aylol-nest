"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { arSA, enUS } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/shared/types";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  locale: string;
};

const arabicLocalization = {
  ...arSA,

  formFieldInputPlaceholder__emailAddress_username: "أدخل البريد الإلكتروني أو اسم المستخدم",
  formFieldInputPlaceholder__emailAddress: "أدخل بريدك الإلكتروني",
  formFieldInputPlaceholder__username: "أدخل اسم المستخدم",
  formFieldInputPlaceholder__password: "أدخل كلمة المرور",
  formFieldInputPlaceholder__signUpPassword: "أنشئ كلمة مرور",
  formFieldInputPlaceholder__firstName: "أدخل الاسم الأول",
  formFieldInputPlaceholder__lastName: "أدخل اسم العائلة",
  formFieldInputPlaceholder__phoneNumber: "أدخل رقم الهاتف",
} satisfies LocalizationResource;

export function AppClerkProvider({ children, locale }: Props) {
  return (
    <ClerkProvider
      localization={locale === "ar" ? arabicLocalization : enUS}
      appearance={{
        variables: {
          colorPrimary: "#8A7B6B",
          borderRadius: "0.75rem",
          fontFamily: "Cairo, sans-serif",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
