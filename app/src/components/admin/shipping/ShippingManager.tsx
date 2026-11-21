"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { priceInCents } from "@/lib/checkout/validation";
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
  const [creating, setCreating] = useState(false);
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

  function addRegion() {
    setCreating(true);
    setEditing(null);
    setFee("");
    setActive(true);
    setError("");
    setSuccess("");
  }

  function edit(region: Region) {
    setCreating(false);
    setEditing(region.slug);
    setFee(String(region.shippingFee));
    setActive(region.isActive);
    setError("");
    setSuccess("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((!editing && !creating) || saving) return;
    const amount = Number(fee);
    if (fee.trim() === "" || priceInCents(amount) === null) {
      setError(t("invalidFee"));
      return;
    }
    const fields = new FormData(event.currentTarget);
    const name = {
      ar: String(fields.get("nameAr") ?? "").trim(),
      en: String(fields.get("nameEn") ?? "").trim(),
    };
    if (creating && (!name.ar || !name.en)) {
      setError(t("invalidName"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        creating ? "/api/admin/shipping" : `/api/admin/shipping/${editing}`,
        {
          method: creating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingFee: amount,
            isActive: active,
            ...(creating ? { name } : {}),
          }),
        },
      );
      if (!response.ok) throw new Error();
      const data: { region: Region } = await response.json();
      setRegions((current) =>
        creating
          ? [...current, data.region]
          : current.map((region) => (region.slug === editing ? data.region : region)),
      );
      setCreating(false);
      setEditing(null);
      setSuccess(t("saved"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  const regionForm = (
    <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4">
      {creating && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            <span>{t("nameAr")}</span>
            <Input name="nameAr" dir="rtl" maxLength={120} required />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>{t("nameEn")}</span>
            <Input name="nameEn" dir="ltr" maxLength={120} required />
          </label>
        </div>
      )}
      <label className="block text-sm font-medium" htmlFor="shipping-fee">
        {t("fee")}
      </label>
      <Input
        id="shipping-fee"
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
          onClick={() => {
            setCreating(false);
            setEditing(null);
            setError("");
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );

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
        <Button type="button" onClick={addRegion} disabled={loading || creating || saving}>
          {t("addRegion")}
        </Button>
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
        {creating && (
          <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 dark:border-[#3a3431] dark:bg-[#292524]">
            <h2 className="text-xl font-semibold">{t("addRegion")}</h2>
            {regionForm}
          </section>
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
                  regionForm
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
                      disabled={saving}
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
