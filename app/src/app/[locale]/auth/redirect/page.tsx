import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AuthRedirectPage({ params }: Props) {
  const { locale } = await params;

  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
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

  redirect(`/${locale}`);
}
