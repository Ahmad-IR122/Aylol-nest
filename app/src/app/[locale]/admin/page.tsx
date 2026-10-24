import Link from "next/link";
import { getLocale } from "next-intl/server";

import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  await connectDB();

  const [productsCount, categoriesCount, ordersCount, customersCount] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
  ]);

  const stats = [
    {
      title: isArabic ? "المنتجات" : "Products",
      value: productsCount,
      href: `/${locale}/admin/products`,
      icon: "📦",
    },
    {
      title: isArabic ? "التصنيفات" : "Categories",
      value: categoriesCount,
      href: `/${locale}/admin/categories`,
      icon: "🏷️",
    },
    {
      title: isArabic ? "الطلبات" : "Orders",
      value: ordersCount,
      href: `/${locale}/admin/orders`,
      icon: "🛒",
    },
    {
      title: isArabic ? "العملاء" : "Customers",
      value: customersCount,
      href: `/${locale}/admin/customers`,
      icon: "👥",
    },
  ];

  return (
    <main className="min-h-screen bg-[#faf8f6] px-5 py-10 transition-colors duration-200 md:px-10 dark:bg-[#171717]">
      <div className="mx-auto max-w-7xl">
        {/* Dashboard Header */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-[#a97872] dark:text-[#d4a39b]">Aylol Nest</p>

          <h1 className="text-3xl font-bold text-[#352d2b] dark:text-[#f5efec]">
            {isArabic ? "لوحة التحكم" : "Admin Dashboard"}
          </h1>

          <p className="mt-3 text-[#817571] dark:text-[#aaa09b]">
            {isArabic
              ? "مرحبًا بك في لوحة إدارة متجر Aylol Nest."
              : "Welcome to your Aylol Nest management dashboard."}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="group rounded-2xl border border-[#eee5e0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-[#3a3431] dark:bg-[#292524] dark:shadow-none dark:hover:border-[#75524d] dark:hover:bg-[#332d2a]"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-3xl">{stat.icon}</span>

                <span className="text-sm text-[#a97872] transition-transform group-hover:-translate-y-0.5 dark:text-[#d4a39b]">
                  ↗
                </span>
              </div>

              <p className="text-sm text-[#817571] dark:text-[#aaa09b]">{stat.title}</p>

              <p className="mt-2 text-4xl font-bold text-[#352d2b] dark:text-[#f5efec]">
                {stat.value.toLocaleString(isArabic ? "ar" : "en")}
              </p>
            </Link>
          ))}
        </div>

        {/* Store Management */}
        <section className="mt-10 rounded-2xl border border-[#eee5e0] bg-white p-7 transition-colors duration-200 dark:border-[#3a3431] dark:bg-[#292524]">
          <h2 className="text-xl font-bold text-[#352d2b] dark:text-[#f5efec]">
            {isArabic ? "إدارة المتجر" : "Store Management"}
          </h2>

          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">
            {isArabic
              ? "من هنا رح تتمكن من إضافة المنتجات والتصنيفات ومتابعة الطلبات."
              : "Manage products, categories, and orders from one place."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {/* Manage Products */}
            <Link
              href={`/${locale}/admin/products`}
              className="rounded-xl bg-[#a97872] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#93635d] dark:bg-[#b7857d] dark:hover:bg-[#a97872]"
            >
              {isArabic ? "إدارة المنتجات" : "Manage Products"}
            </Link>

            {/* Manage Categories */}
            <Link
              href={`/${locale}/admin/categories`}
              className="rounded-xl border border-[#e7d8d1] px-5 py-3 text-sm font-semibold text-[#7b5d55] transition-colors hover:bg-[#faf4f1] dark:border-[#75524d] dark:text-[#e2ada4] dark:hover:bg-[#3b2d2b]"
            >
              {isArabic ? "إدارة التصنيفات" : "Manage Categories"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
