
import { SignUp } from "@clerk/nextjs";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <SignUp
        routing="hash"
        signInUrl={`/${locale}/sign-in`}
        fallbackRedirectUrl={`/${locale}`}
      />
    </main>
  );
}
