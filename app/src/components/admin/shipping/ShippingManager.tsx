"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Region = {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  shippingFee: number;
  isActive: boolean;
  updatedAt: string;
};

export default function ShippingManager({ locale }: { locale: string }) {
  const t = useTranslations("AdminShipping");
  const format = useFormatter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [fee, setFee] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/shipping", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.regions)) throw new Error();
      setRegions(data.regions);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function edit(region: Region) {
    setEditing(region.slug);
    setFee(String(region.shippingFee));
    setActive(region.isActive);
    setError("");
    setSuccess("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    const amount = Number(fee);
    if (
      fee.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isSafeInteger(amount * 100)
    ) {
      setError(t("invalidFee"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/shipping/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingFee: amount, isActive: active }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setRegions((current) =>
        current.map((region) => (region.slug === editing ? data.region : region)),
      );
      setEditing(null);
      setSuccess(t("saved"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="min-h-dvh bg-[#faf8f6] px-4 py-8 text-[#352d2b] md:px-8 dark:bg-[#171717] dark:text-[#f5efec]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <div>
          <p className="text-sm font-semibold text-[#a97872] dark:text-[#d4a39b]">
            Aylol Nest / Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-4 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="rounded-xl bg-green-50 p-4 text-green-800 dark:bg-green-950/40 dark:text-green-200"
          >
            {success}
          </p>
        )}
        {loading ? (
          <p>{t("loading")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {regions.map((region) => (
              <section
                key={region.slug}
                className="rounded-2xl border border-[#eee5e0] bg-white p-5 shadow-sm dark:border-[#3a3431] dark:bg-[#292524]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {region.name[locale === "ar" ? "ar" : "en"]}
                    </h2>
                    <p className="mt-1 text-xs text-[#817571] dark:text-[#aaa09b]">{region.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${region.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}
                  >
                    {t(region.isActive ? "active" : "inactive")}
                  </span>
                </div>
                {editing === region.slug ? (
                  <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4">
                    <label className="block text-sm font-medium" htmlFor={`fee-${region.slug}`}>
                      {t("fee")}
                    </label>
                    <Input
                      id={`fee-${region.slug}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={fee}
                      onChange={(event) => setFee(event.target.value)}
                      className="dark:bg-[#211e1c]"
                    />
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(event) => setActive(event.target.checked)}
                        className="size-4 accent-[#a97872]"
                      />
                      {t("available")}
                    </label>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>
                        {t(saving ? "saving" : "save")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={saving}
                        onClick={() => setEditing(null)}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-5">
                    <p className="text-sm text-[#817571] dark:text-[#aaa09b]">{t("fee")}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      <bdi>
                        {format.number(region.shippingFee, {
                          style: "currency",
                          currency: "ILS",
                          currencyDisplay: "narrowSymbol",
                        })}
                      </bdi>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5 min-h-11"
                      onClick={() => edit(region)}
                    >
                      {t("edit")}
                    </Button>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
