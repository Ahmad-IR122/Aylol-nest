import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getCurrentCartUser } from "@/lib/auth/current-user";
import { productReturnPath } from "@/lib/auth/product-return";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function AuthRedirectPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const returnPath = returnTo === `/${locale}/account` ? returnTo : productReturnPath(locale, returnTo);

  const { userId } = await auth();

  if (!userId) {
    redirect(
      `/${locale}/sign-in${returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ""}`,
    );
  }

  const user = await getCurrentCartUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  if (returnPath === `/${locale}/account`) {
    redirect(returnPath);
  }

  if (user.role === "admin") {
    redirect(`/${locale}/admin`);
  }

  redirect(returnPath ?? `/${locale}`);
}
