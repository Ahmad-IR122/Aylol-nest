import { SignIn } from "@clerk/nextjs";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <SignIn routing="hash" signUpUrl={`/${locale}/sign-up`} fallbackRedirectUrl={`/${locale}`} />
    </main>
  );
}
