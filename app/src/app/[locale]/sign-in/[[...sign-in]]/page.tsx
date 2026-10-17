import { SignIn } from "@clerk/nextjs";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="flex min-h-[75vh] items-center justify-center px-4 py-12"
    >
      <SignIn
        routing="hash"
        signUpUrl={`/${locale}/sign-up`}
        forceRedirectUrl={`/${locale}/auth/redirect`}
      />
    </main>
  );
}
