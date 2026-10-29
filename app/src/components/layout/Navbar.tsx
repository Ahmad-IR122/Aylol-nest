"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun, ShoppingBag, Menu, X, LayoutDashboard } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Show, UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useCart } from "@/components/cart/CartProvider";

type NavbarProps = {
  isAdmin?: boolean;
};

export function Navbar({ isAdmin = false }: NavbarProps) {
  const t = useTranslations("Navbar");
  const cartText = useTranslations("Cart");
  const cart = useCart();
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/boys", label: t("boys") },
    { href: "/girls", label: t("girls") },
  ];

  return (
    <header className="bg-background/95 sticky top-0 z-50 border-b border-[#C9B8A4]/40 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:h-24 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/aylol-nest-logo.png"
            alt="Aylol Nest Logo"
            width={120}
            height={120}
            priority
            className="h-16 w-auto object-contain sm:h-20"
            style={{ borderRadius: "50%" }}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/80 hover:text-primary inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold transition-colors lg:min-h-0 lg:min-w-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
            }
            aria-label="Toggle theme"
            className="size-11 lg:size-8"
          >
            <Sun className="hidden size-5 dark:block" />
            <Moon className="size-5 dark:hidden" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative hidden size-11 md:inline-flex lg:size-8"
          >
            <Link href="/cart" aria-label={cartText("open", { count: cart.count })}>
              <ShoppingBag className="size-5" />
              {cart.count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -end-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#a97872] px-1 text-[10px] text-white dark:bg-[#d4a39b] dark:text-[#171717]"
                >
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              )}
            </Link>
          </Button>

          {/* Admin Dashboard - Desktop */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden items-center gap-2 border-[#a97872]/40 text-[#a97872] hover:bg-[#f8eeeb] md:inline-flex dark:text-[#d4a39b] dark:hover:bg-[#3b2d2b]"
            >
              <Link href="/admin">
                <LayoutDashboard className="size-4" />
                {isArabic ? "لوحة التحكم" : "Dashboard"}
              </Link>
            </Button>
          )}

          <div className="hidden items-center md:flex">
            <Show when="signed-out">
              <Button variant="ghost" size="sm" className="min-h-11 lg:min-h-7" asChild>
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
            className="size-11 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            data-store-menu-trigger
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
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

          {/* Admin Dashboard - Mobile */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-[#a97872] hover:bg-[#f8eeeb] dark:text-[#d4a39b] dark:hover:bg-[#3b2d2b]"
            >
              <LayoutDashboard className="size-5" />
              {isArabic ? "لوحة التحكم" : "Admin Dashboard"}
            </Link>
          )}

          <Button
            variant="ghost"
            asChild
            className="justify-start rounded-lg px-3 py-3 font-semibold"
          >
            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              aria-label={cartText("open", { count: cart.count })}
            >
              <ShoppingBag className="size-5" />
              {t("cart")} {cart.count > 0 && <span aria-hidden="true">({cart.count})</span>}
            </Link>
          </Button>

          <Show when="signed-out">
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-secondary rounded-lg px-3 py-3 font-semibold"
            >
              {t("login")}
            </Link>
          </Show>
        </nav>
      )}
    </header>
  );
}
