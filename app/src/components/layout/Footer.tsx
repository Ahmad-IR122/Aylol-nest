import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MapPin, Mail, Phone, Clock3, Heart } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { contactConfig } from "@/lib/contact/config";

const shopLinks = [
  { label: "girls", href: "/girls" },
  { label: "boys", href: "/boys" },
  { label: "babies", href: "/babies" },
  { label: "newArrivals", href: "/newArrivals" },
] as const;

const serviceLinks = [
  { label: "contactUs", href: "/contact" },
  { label: "faq", href: "/faq" },
] as const;

export default async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-[#E8DED4] bg-[#F5F0E9] text-[#3B342D] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-8 sm:px-8 lg:px-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-2 md:text-start lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col items-center gap-5 md:items-start">
            <Link href={`/${locale}`} className="inline-block">
              <Image
                src="/images/aylol-nest-logo.png"
                alt="Aylol Nest"
                width={150}
                height={100}
                className="h-auto w-36 object-contain"
              />
            </Link>

            <p className="max-w-xs text-center text-sm leading-7 text-[#8A7B6B] md:text-start dark:text-stone-400">
              {t("description")}
            </p>

            {/* Social Media */}
            <div className="flex items-center justify-center gap-4 md:justify-start">
              {contactConfig.instagram && (
                <a
                  href={contactConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex size-11 items-center justify-center transition-colors hover:text-[#A78162]"
                >
                  <FaInstagram size={20} />
                </a>
              )}

              {contactConfig.facebook && (
                <a
                  href={contactConfig.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex size-11 items-center justify-center transition-colors hover:text-[#A78162]"
                >
                  <FaFacebook size={20} />
                </a>
              )}

              {contactConfig.tiktok && (
                <a
                  href={contactConfig.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex size-11 items-center justify-center text-sm font-bold transition-colors hover:text-[#A78162]"
                >
                  <FaTiktok size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Shop */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-6 text-sm font-semibold">{t("shop")}</h3>

            <ul className="space-y-3">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={`/${locale}${item.href}`}
                    className="inline-flex min-h-11 min-w-11 items-center text-sm text-[#8A7B6B] transition-colors hover:text-[#3B342D] dark:text-stone-400 dark:hover:text-white"
                  >
                    {t(item.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-6 text-sm font-semibold">{t("customerService")}</h3>

            <ul className="space-y-3">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={`/${locale}${item.href}`}
                    className="inline-flex min-h-11 min-w-11 items-center text-sm text-[#8A7B6B] transition-colors hover:text-[#3B342D] dark:text-stone-400 dark:hover:text-white"
                  >
                    {t(item.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-6 text-sm font-semibold">{t("contact")}</h3>

            <div className="flex flex-col items-center gap-4 text-sm text-[#8A7B6B] md:items-start dark:text-stone-400">
              {contactConfig.email && (
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <Mail size={17} className="shrink-0" />
                  <span>{contactConfig.email}</span>
                </div>
              )}

              {contactConfig.phone && (
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <Phone size={17} className="shrink-0" />
                  <span dir="ltr">{contactConfig.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 md:justify-start">
                <MapPin size={17} className="shrink-0" />
                <span>{t("location")}</span>
              </div>

              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Clock3 size={17} className="shrink-0" />
                <span>{t("workingHours")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-[#DDD2C7] pt-6 text-center text-xs text-[#8A7B6B] md:flex-row md:justify-between md:text-start dark:border-stone-700 dark:text-stone-400">
          <p>
            © {new Date().getFullYear()} Aylol Nest. {t("rights")}
          </p>

          <p className="flex items-center justify-center gap-1">
            {t("madeWith")}
            <Heart size={13} className="fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}
