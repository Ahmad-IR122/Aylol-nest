import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { listContactMessages } from "@/lib/admin/contact";
import { updateContactStatus } from "./actions";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function AdminContactPage({ params, searchParams }: Props) {
  const [{ locale }, { page: rawPage }, t, format] = await Promise.all([
    params,
    searchParams,
    getTranslations("AdminContact"),
    getFormatter(),
  ]);
  const page = typeof rawPage === "string" && /^[1-9]\d{0,5}$/.test(rawPage) ? Number(rawPage) : 1;
  const data = await listContactMessages(page);
  const href = (value: number) => `/${locale}/admin/contact${value === 1 ? "" : `?page=${value}`}`;

  return (
    <main className="min-w-0 p-5 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        </header>
        {data.messages.length === 0 ? (
          <p className="rounded-2xl border border-[#eee5e0] bg-white p-8 text-center dark:border-[#3a3431] dark:bg-[#292524]">
            {t(page > 1 ? "emptyPage" : "empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {data.messages.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#eee5e0] bg-white p-5 dark:border-[#3a3431] dark:bg-[#292524]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold break-words">{item.subject}</h2>
                    <p className="mt-1 text-sm text-[#817571] dark:text-[#aaa09b]">
                      {item.fullName} · <bdi>{item.email}</bdi>
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === "handled" ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"}`}
                  >
                    {t(item.status)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-[#817571] dark:text-[#aaa09b]">
                  {format.dateTime(item.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Hebron",
                  })}
                  {item.phone ? ` · ${item.phone}` : ""}
                </p>
                <p className="mt-4 leading-7 break-words whitespace-pre-wrap">{item.message}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`}
                    className="inline-flex min-h-10 items-center rounded-lg bg-[#a97872] px-4 py-2 text-sm font-semibold text-white hover:bg-[#91615c]"
                  >
                    {t("reply")}
                  </a>
                  <form action={updateContactStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={item.status === "handled" ? "new" : "handled"}
                    />
                    <button
                      type="submit"
                      className="min-h-10 rounded-lg border border-[#c9b8a4] px-4 py-2 text-sm font-semibold hover:bg-[#faf6f3] dark:hover:bg-[#332d2a]"
                    >
                      {t(item.status === "handled" ? "markNew" : "markHandled")}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
        {data.totalPages > 1 && (
          <nav aria-label={t("pagination")} className="flex items-center justify-center gap-4">
            {page > 1 && (
              <Link href={href(page - 1)} className="rounded-lg border border-[#c9b8a4] px-4 py-2">
                {t("previous")}
              </Link>
            )}
            <span className="text-sm">{t("pageOf", { page, total: data.totalPages })}</span>
            {page < data.totalPages && (
              <Link href={href(page + 1)} className="rounded-lg border border-[#c9b8a4] px-4 py-2">
                {t("next")}
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
