
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, Store, Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

import AdminSidebar from "./AdminSidebar";

type Props = {
  children: ReactNode;
  locale: string;
};

export default function AdminShell({
  children,
  locale,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isArabic = locale === "ar";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#faf8f6]"
    >
      <AdminSidebar
        locale={locale}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={
          isArabic ? "lg:mr-72" : "lg:ml-72"
        }
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#eee5e0] bg-white px-5 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={isArabic ? "فتح القائمة" : "Open menu"}
              className="rounded-lg p-2 text-[#352d2b] hover:bg-[#faf6f3] lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="font-semibold text-[#352d2b]">
                {isArabic
                  ? "إدارة المتجر"
                  : "Store Management"}
              </h2>
              <p className="text-xs text-[#817571]">
                Aylol Nest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <Link
              href={`/${locale}`}
              aria-label={isArabic ? "زيارة المتجر" : "Visit store"}
              title={isArabic ? "زيارة المتجر" : "Visit store"}
              className="rounded-lg p-2 text-[#6d625e] hover:bg-[#faf6f3]"
            >
              <Store size={21} />
            </Link>

            <button
              type="button"
              disabled
              title={
                isArabic
                  ? "الإشعارات قريبًا"
                  : "Notifications coming soon"
              }
              aria-label={
                isArabic
                  ? "الإشعارات قريبًا"
                  : "Notifications coming soon"
              }
              className="cursor-not-allowed rounded-lg p-2 text-[#bdb4af]"
            >
              <Bell size={21} />
            </button>

            <UserButton />
          </div>
        </header>

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
