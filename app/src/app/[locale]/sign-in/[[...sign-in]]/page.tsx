import { SignIn } from "@clerk/nextjs";
import { productReturnPath } from "@/lib/auth/product-return";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const returnPath = returnTo === `/${locale}/account` ? returnTo : productReturnPath(locale, returnTo);

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="flex min-h-[75vh] items-center justify-center px-4 py-12"
    >
      <SignIn
        routing="hash"
        signUpUrl={`/${locale}/sign-up`}
        forceRedirectUrl={`/${locale}/auth/redirect${returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ""}`}
      />
    </main>
  );
}
