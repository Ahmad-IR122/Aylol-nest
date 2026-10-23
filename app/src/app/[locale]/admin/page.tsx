
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

  const [productsCount, categoriesCount, ordersCount, customersCount] =
    await Promise.all([
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
    <main className="min-h-screen bg-[#faf8f6] px-5 py-10 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-[#a97872]">
            Aylol Nest
          </p>

          <h1 className="text-3xl font-bold text-[#352d2b]">
            {isArabic ? "لوحة التحكم" : "Admin Dashboard"}
          </h1>

          <p className="mt-3 text-[#817571]">
            {isArabic
              ? "مرحبًا بك في لوحة إدارة متجر Aylol Nest."
              : "Welcome to your Aylol Nest management dashboard."}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="rounded-2xl border border-[#eee5e0] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-sm text-[#a97872]">↗</span>
              </div>

              <p className="text-sm text-[#817571]">
                {stat.title}
              </p>

              <p className="mt-2 text-4xl font-bold text-[#352d2b]">
                {stat.value.toLocaleString(
                  isArabic ? "ar" : "en",
                )}
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-[#eee5e0] bg-white p-7">
          <h2 className="text-xl font-bold text-[#352d2b]">
            {isArabic ? "إدارة المتجر" : "Store Management"}
          </h2>

          <p className="mt-2 text-sm text-[#817571]">
            {isArabic
              ? "من هنا رح تتمكن من إضافة المنتجات والتصنيفات ومتابعة الطلبات."
              : "Manage products, categories, and orders from one place."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/admin/products`}
              className="rounded-xl bg-[#a97872] px-5 py-3 text-sm font-semibold text-white hover:bg-[#93635d]"
            >
              {isArabic ? "إدارة المنتجات" : "Manage Products"}
            </Link>

            <Link
              href={`/${locale}/admin/categories`}
              className="rounded-xl border border-[#e7d8d1] px-5 py-3 text-sm font-semibold text-[#7b5d55] hover:bg-[#faf4f1]"
            >
              {isArabic ? "إدارة التصنيفات" : "Manage Categories"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
