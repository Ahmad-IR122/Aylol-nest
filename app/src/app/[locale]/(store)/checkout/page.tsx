import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import CheckoutPage from "@/components/checkout/CheckoutPage";
import { getCurrentCartUser } from "@/lib/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Checkout");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(`/${locale}/checkout`)}`);

  const user = await getCurrentCartUser();
  if (!user || user.role !== "customer") redirect(`/${locale}`);
  return <CheckoutPage />;
}
