import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/auth/current-user";

type Props = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const locale = await getLocale();
  const user = await getCurrentUser();

  // User is not authenticated or not found in MongoDB
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // User is authenticated but not an admin
  if (user.role !== "admin") {
    redirect(`/${locale}`);
  }

  return <>{children}</>;
}
