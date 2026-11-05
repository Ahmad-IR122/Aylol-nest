import { getTranslations } from "next-intl/server";

export default async function OrdersLoading() {
  const t = await getTranslations("CustomerOrders");
  return (
    <main
      className="min-h-[70vh] bg-[#faf8f6] px-4 py-10 dark:bg-[#171717]"
      role="status"
      aria-label={t("loading")}
    >
      <div className="mx-auto max-w-5xl animate-pulse space-y-5">
        <div className="h-10 w-48 rounded bg-[#eee5e0] dark:bg-[#3a3431]" />
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-36 rounded-2xl bg-[#eee5e0] dark:bg-[#3a3431]" />
        ))}
      </div>
    </main>
  );
}
