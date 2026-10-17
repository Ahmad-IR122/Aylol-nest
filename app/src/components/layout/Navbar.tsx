"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun, ShoppingBag, Menu, X } from "lucide-react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Show, UserButton } from "@clerk/nextjs";

export function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);

  const changeLanguage = () => {
    router.replace(pathname, {
      locale: locale === "ar" ? "en" : "ar",
    });
    setMenuOpen(false);
  };

  const links = [
    { href: "/", label: t("home") },
    { href: "/boys", label: t("boys") },
    { href: "/girls", label: t("girls") },
  ];

  return (
    <header className="bg-background/95 sticky top-0 z-50 border-b border-[#C9B8A4]/40 backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/aylol-nest-logo.png"
            alt="Aylol Nest Logo"
            width={120}
            height={120}
            priority
            className="h-20 w-auto object-contain"
            style={{ borderRadius: "50%" }}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/80 hover:text-primary text-sm font-semibold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={changeLanguage} className="font-bold">
            {locale === "ar" ? "EN" : "عربي"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
            }
            aria-label="Toggle theme"
          >
            <Sun className="hidden size-5 dark:block" />
            <Moon className="size-5 dark:hidden" />
          </Button>

          <Button variant="ghost" size="icon" aria-label={t("cart")}>
            <ShoppingBag className="size-5" />
          </Button>

          <div className="flex items-center">
            <Show when="signed-out">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">{t("login")}</Link>
              </Button>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-border/60 bg-background flex flex-col gap-1 border-t px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="hover:bg-secondary rounded-lg px-3 py-3 font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
