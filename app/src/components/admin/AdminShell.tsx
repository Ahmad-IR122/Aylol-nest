
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, Store, Bell, Moon, Sun } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import AdminSidebar from "./AdminSidebar";

type Props = {
  children: ReactNode;
  locale: string;
};

export default function AdminShell({ children, locale }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();

  const isArabic = locale === "ar";
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#faf8f6] text-[#352d2b] dark:bg-[#171717] dark:text-[#f5efec]"
    >
      <AdminSidebar
        locale={locale}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={isArabic ? "lg:mr-72" : "lg:ml-72"}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#eee5e0] bg-white px-5 dark:border-[#3a3431] dark:bg-[#211e1c] md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={isArabic ? "فتح القائمة" : "Open menu"}
              className="rounded-lg p-2 text-[#352d2b] transition-colors hover:bg-[#faf6f3] dark:text-[#f5efec] dark:hover:bg-[#332d2a] lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="font-semibold text-[#352d2b] dark:text-[#f5efec]">
                {isArabic ? "إدارة المتجر" : "Store Management"}
              </h2>

              <p className="text-xs text-[#817571] dark:text-[#aaa09b]">
                Aylol Nest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />

            {/* Theme Toggle */}
            {mounted ? (
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={
                  isDark
                    ? isArabic
                      ? "تفعيل الوضع الفاتح"
                      : "Switch to light mode"
                    : isArabic
                      ? "تفعيل الوضع الداكن"
                      : "Switch to dark mode"
                }
                title={
                  isDark
                    ? isArabic
                      ? "الوضع الفاتح"
                      : "Light mode"
                    : isArabic
                      ? "الوضع الداكن"
                      : "Dark mode"
                }
                className="flex size-10 items-center justify-center rounded-xl text-[#6d625e] transition-colors hover:bg-[#faf6f3] dark:text-[#f5efec] dark:hover:bg-[#332d2a]"
              >
                {isDark ? <Sun size={21} /> : <Moon size={21} />}
              </button>
            ) : (
              <div className="size-10" aria-hidden="true" />
            )}

            {/* Visit Store */}
            <Link
              href={`/${locale}`}
              aria-label={isArabic ? "زيارة المتجر" : "Visit store"}
              title={isArabic ? "زيارة المتجر" : "Visit store"}
              className="rounded-lg p-2 text-[#6d625e] transition-colors hover:bg-[#faf6f3] dark:text-[#f5efec] dark:hover:bg-[#332d2a]"
            >
              <Store size={21} />
            </Link>

            {/* Notifications */}
            <button
              type="button"
              disabled
              title={isArabic ? "الإشعارات قريبًا" : "Notifications coming soon"}
              aria-label={isArabic ? "الإشعارات قريبًا" : "Notifications coming soon"}
              className="cursor-not-allowed rounded-lg p-2 text-[#bdb4af] dark:text-[#706965]"
            >
              <Bell size={21} />
            </button>

            <UserButton />
          </div>
        </header>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
