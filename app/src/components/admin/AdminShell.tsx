"use client";

import { useState, type ReactNode } from "react";
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

  const { resolvedTheme, setTheme } = useTheme();

  const isArabic = locale === "ar";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-dvh bg-[#faf8f6] text-[#352d2b] dark:bg-[#171717] dark:text-[#f5efec]"
    >
      <AdminSidebar locale={locale} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ms-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#eee5e0] bg-white px-5 md:px-8 dark:border-[#3a3431] dark:bg-[#211e1c]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={isArabic ? "فتح القائمة" : "Open menu"}
              className="size-11 shrink-0 rounded-lg p-2 text-[#352d2b] transition-colors hover:bg-[#faf6f3] lg:hidden dark:text-[#f5efec] dark:hover:bg-[#332d2a]"
            >
              <Menu size={23} />
            </button>

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-[#352d2b] dark:text-[#f5efec]">
                {isArabic ? "إدارة المتجر" : "Store Management"}
              </h2>

              <p className="hidden text-xs text-[#817571] sm:block dark:text-[#aaa09b]">
                Aylol Nest
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-4">
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={isArabic ? "تبديل المظهر" : "Toggle theme"}
              title={isArabic ? "تبديل المظهر" : "Toggle theme"}
              className="flex size-11 items-center justify-center rounded-xl text-[#6d625e] transition-colors hover:bg-[#faf6f3] dark:text-[#f5efec] dark:hover:bg-[#332d2a]"
            >
              <Sun size={21} className="hidden dark:block" aria-hidden="true" />
              <Moon size={21} className="dark:hidden" aria-hidden="true" />
            </button>

            {/* Visit Store */}
            <Link
              href={`/${locale}`}
              aria-label={isArabic ? "زيارة المتجر" : "Visit store"}
              title={isArabic ? "زيارة المتجر" : "Visit store"}
              className="flex size-11 items-center justify-center rounded-lg text-[#6d625e] transition-colors hover:bg-[#faf6f3] dark:text-[#f5efec] dark:hover:bg-[#332d2a]"
            >
              <Store size={21} />
            </Link>

            {/* Notifications */}
            <button
              type="button"
              disabled
              title={isArabic ? "الإشعارات قريبًا" : "Notifications coming soon"}
              aria-label={isArabic ? "الإشعارات قريبًا" : "Notifications coming soon"}
              className="hidden size-11 items-center justify-center rounded-lg text-[#bdb4af] sm:flex dark:text-[#706965]"
            >
              <Bell size={21} />
            </button>

            <UserButton appearance={{ elements: { userButtonTrigger: "!size-11" } }} />
          </div>
        </header>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
