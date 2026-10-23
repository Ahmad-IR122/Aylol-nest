
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/auth/current-user";

type Props = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const locale = await getLocale();
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await getCurrentUser();

  if (!user || !user.isActive || user.role !== "admin") {
    redirect(`/${locale}`);
  }

  return <>{children}</>;
}
