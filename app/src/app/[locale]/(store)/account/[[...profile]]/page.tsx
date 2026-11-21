import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, { userId }] = await Promise.all([params, auth()]);
  const accountPath = `/${locale}/account`;

  if (!userId) {
    redirect(`/${locale}/sign-in?returnTo=${encodeURIComponent(accountPath)}`);
  }

  return (
    <main className="flex min-h-[70vh] justify-center px-4 py-12">
      <UserProfile routing="path" path={accountPath} />
    </main>
  );
}
