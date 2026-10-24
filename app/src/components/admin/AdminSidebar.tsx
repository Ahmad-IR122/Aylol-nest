
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  Truck,
  LogOut,
  X,
} from "lucide-react";

type Props = {
  locale: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminSidebar({
  locale,
  isOpen,
  onClose,
}: Props) {
  const pathname = usePathname();
  const isArabic = locale === "ar";

  const links = [
    {
      href: `/${locale}/admin`,
      label: isArabic ? "لوحة التحكم" : "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/admin/products`,
      label: isArabic ? "المنتجات" : "Products",
      icon: Package,
    },
    {
      href: `/${locale}/admin/categories`,
      label: isArabic ? "التصنيفات" : "Categories",
      icon: Tags,
    },
    {
      href: `/${locale}/admin/orders`,
      label: isArabic ? "الطلبات" : "Orders",
      icon: ShoppingBag,
    },
    {
      href: `/${locale}/admin/customers`,
      label: isArabic ? "العملاء" : "Customers",
      icon: Users,
    },
    {
      href: `/${locale}/admin/shipping`,
      label: isArabic ? "التوصيل" : "Shipping",
      icon: Truck,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        dir={isArabic ? "rtl" : "ltr"}
        className={`fixed inset-y-0 z-50 flex w-72 flex-col border-e border-[#eee5e0] bg-white transition-colors duration-300 dark:border-[#3a3431] dark:bg-[#211e1c] ${
          isArabic ? "right-0" : "left-0"
        } ${
          isOpen
            ? "translate-x-0"
            : isArabic
              ? "translate-x-full lg:translate-x-0"
              : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          transitionProperty: "transform, background-color, border-color",
        }}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between border-b border-[#eee5e0] px-6 dark:border-[#3a3431]">
          <div>
            <p className="text-xl font-bold text-[#a97872] dark:text-[#d4a39b]">
              Aylol Nest
            </p>

            <p className="text-xs text-[#817571] dark:text-[#aaa09b]">
              Admin Panel
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
            className="rounded-lg p-2 text-[#817571] transition-colors hover:bg-[#faf6f3] dark:text-[#aaa09b] dark:hover:bg-[#332d2a] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== `/${locale}/admin` &&
                pathname.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#f8eeeb] text-[#a97872] dark:bg-[#3b2d2b] dark:text-[#e2ada4]"
                    : "text-[#6d625e] hover:bg-[#faf6f3] dark:text-[#c9c0bb] dark:hover:bg-[#332d2a]"
                }`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-[#eee5e0] p-4 dark:border-[#3a3431]">
          <SignOutButton redirectUrl={`/${locale}`}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut size={19} />
              {isArabic ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
