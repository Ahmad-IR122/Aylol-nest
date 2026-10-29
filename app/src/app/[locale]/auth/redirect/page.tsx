import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { productReturnPath } from "@/lib/auth/product-return";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function AuthRedirectPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const productPath = productReturnPath(locale, returnTo);

  const { userId } = await auth();

  if (!userId) {
    redirect(
      `/${locale}/sign-in${productPath ? `?returnTo=${encodeURIComponent(productPath)}` : ""}`,
    );
  }

  await connectDB();

  const user = await User.findOne({
    clerkId: userId,
    isActive: true,
  }).lean();

  if (!user) {
    // The Clerk webhook may not have synced the user yet.
    redirect(`/${locale}`);
  }

  if (user.role === "admin") {
    redirect(`/${locale}/admin`);
  }

  redirect(productPath ?? `/${locale}`);
}
