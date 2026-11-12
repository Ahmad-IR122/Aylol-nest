import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import { contactConfig } from "@/lib/contact/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  return { title: t("title") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  const details = [
    contactConfig.email && {
      icon: Mail,
      label: t("emailLabel"),
      value: contactConfig.email,
      href: `mailto:${contactConfig.email}`,
    },
    contactConfig.phone && {
      icon: Phone,
      label: t("phoneLabel"),
      value: contactConfig.phone,
      href: `tel:${contactConfig.phone}`,
    },
    contactConfig.whatsapp && {
      icon: Phone,
      label: t("whatsappLabel"),
      value: contactConfig.whatsapp,
      href: `https://wa.me/${contactConfig.whatsapp.replace(/\D/g, "")}`,
    },
    contactConfig.address && {
      icon: MapPin,
      label: t("addressLabel"),
      value: contactConfig.address,
      href: null,
    },
  ].filter(
    (detail): detail is { icon: typeof Mail; label: string; value: string; href: string | null } =>
      !!detail,
  );
  const social = [
    contactConfig.instagram && { label: "Instagram", href: contactConfig.instagram },
    contactConfig.facebook && { label: "Facebook", href: contactConfig.facebook },
    contactConfig.tiktok && { label: "TikTok", href: contactConfig.tiktok },
  ].filter((item): item is { label: string; href: string } => !!item);

  return (
    <main className="min-h-[70vh] bg-[#F8F6F1] px-4 py-12 text-[#3B342D] sm:px-6 md:py-20 dark:bg-[#171512] dark:text-[#F8F6F1]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-[#8A7B6B] dark:text-[#C9B8A4]">{t("intro")}</p>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section aria-label={t("information")} className="space-y-6">
            <h2 className="text-2xl font-semibold">Aylol Nest</h2>
            {details.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-1 size-5 shrink-0 text-[#8A6B60] dark:text-[#D2AC9F]" />
                <div>
                  <p className="text-sm text-[#8A7B6B] dark:text-[#C9B8A4]">{label}</p>
                  {href ? (
                    <a href={href} className="underline underline-offset-4">
                      <bdi>{value}</bdi>
                    </a>
                  ) : (
                    <p>{value}</p>
                  )}
                </div>
              </div>
            ))}
            {social.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">{t("social")}</h3>
                <div className="flex flex-wrap gap-4">
                  {social.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
