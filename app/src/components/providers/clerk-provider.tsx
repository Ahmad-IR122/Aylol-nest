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

  // Sign-in errors
  unstable__errors: {
    ...arSA.unstable__errors,
    form_password_incorrect: "كلمة المرور غير صحيحة، حاول مرة أخرى.",
    form_identifier_not_found: "لم يتم العثور على حساب بهذه البيانات.",
    form_code_incorrect: "رمز التحقق غير صحيح، حاول مرة أخرى.",
  },
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
