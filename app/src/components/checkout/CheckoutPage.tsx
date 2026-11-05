"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, ChevronLeft, ShoppingBag, Truck, Wallet } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { useCart, type ApiCartItem } from "@/components/cart/CartProvider";
import ProductImage from "@/components/home/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { checkoutSchema, shippingFees, type CheckoutInput } from "@/lib/checkout/validation";
import type { HomeLocale } from "@/lib/home-data";

type FormValues = Omit<CheckoutInput, "region"> & { region: CheckoutInput["region"] | "" };
type ErrorCode =
  | "validation"
  | "stock"
  | "expired"
  | "changed"
  | "unavailable"
  | "network"
  | "server"
  | "session"
  | "conflict";

const initialForm: FormValues = {
  customerName: "",
  phone: "",
  region: "",
  city: "",
  address: "",
  notes: "",
};

function checkoutConflict(message: string): ErrorCode {
  if (message === "Cart is empty") return "expired";
  if (message.includes("stock")) return "stock";
  if (message.includes("unavailable")) return "unavailable";
  if (message.startsWith("Order conflict") || message.startsWith("Idempotency key"))
    return "conflict";
  return "changed";
}

export default function CheckoutPage() {
  const locale = useLocale() as HomeLocale;
  const t = useTranslations("Checkout");
  const cart = useCart();
  const router = useRouter();
  const format = useFormatter();
  const [form, setForm] = useState<FormValues>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [error, setError] = useState<ErrorCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<{
    items: ApiCartItem[];
    subtotal: number;
    cartRevision: number;
  } | null>(null);
  const locked = useRef(false);
  const keyRef = useRef<string | null>(null);
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });
  const fee = form.region ? shippingFees[form.region] : null;
  const unavailable = cart.items.some((item) => !item.available);
  const summary = uncertain && submittedSummary ? submittedSummary : cart;

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    if (uncertain || completed) return;
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: false }));
    setError(null);
    keyRef.current = null;
    setSubmittedSummary(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || completed) return;
    if (cart.busy || (!uncertain && (cart.loading || cart.error))) {
      setError("server");
      return;
    }
    if (!uncertain && (unavailable || cart.items.length === 0)) {
      setError(unavailable ? "stock" : "expired");
      return;
    }

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const fields: Partial<Record<keyof FormValues, boolean>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormValues;
        if (field in form) fields[field] = true;
      }
      setFieldErrors(fields);
      setError("validation");
      return;
    }

    const key = (keyRef.current ??= crypto.randomUUID());
    const cartRevision = submittedSummary?.cartRevision ?? cart.revision;
    if (!submittedSummary)
      setSubmittedSummary({ items: cart.items, subtotal: cart.subtotal, cartRevision });
    locked.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      let response: Response;
      try {
        response = await fetch("/api/checkout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "Idempotency-Key": key },
          body: JSON.stringify({ ...parsed.data, cartRevision }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }
      const data: {
        orderId?: string;
        orderNumber?: string;
        message?: string;
        errors?: { path: string }[];
      } = await response.json();

      if (response.ok) {
        if (!/^[a-f\d]{24}$/i.test(data.orderId ?? "") || !data.orderNumber)
          throw new Error("Invalid checkout response");
        setCompleted(true);
        void cart.refresh();
        router.push(`/checkout/confirmation/${data.orderId}`);
        return;
      }

      if (response.status === 401) {
        router.push(`/sign-in?returnTo=${encodeURIComponent(`/${locale}/checkout`)}`);
        return;
      }
      if (response.status === 400) {
        const fields: Partial<Record<keyof FormValues, boolean>> = {};
        for (const issue of data.errors ?? []) {
          const field = issue.path as keyof FormValues;
          if (field in form) fields[field] = true;
        }
        setFieldErrors(fields);
        setError("validation");
        keyRef.current = null;
        setUncertain(false);
        setSubmittedSummary(null);
        return;
      }
      if (response.status === 403) {
        setError("session");
        return;
      }
      if (response.status === 409) {
        const conflict = checkoutConflict(data.message ?? "");
        setError(conflict);
        if (conflict === "conflict") {
          setUncertain(true);
        } else {
          setUncertain(false);
          keyRef.current = null;
          setSubmittedSummary(null);
          void cart.refresh();
        }
        return;
      }
      setUncertain(true);
      setError("server");
    } catch {
      setUncertain(true);
      setError("network");
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-12 rounded-xl border-[#eee5e0] bg-white px-4 dark:border-[#3a3431] dark:bg-[#292524]";
  const fieldClass = "space-y-2";
  const fieldError = (field: keyof FormValues) =>
    fieldErrors[field] ? (
      <p className="text-xs text-rose-700 dark:text-rose-300">{t("fieldError")}</p>
    ) : null;

  return (
    <main
      className="min-h-[70vh] bg-[#faf8f6] px-4 py-8 text-[#352d2b] sm:px-6 sm:py-12 lg:py-16 dark:bg-[#171717] dark:text-[#f5efec]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#704c47] hover:underline dark:text-[#d4a39b]"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("backToCart")}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>

        {(cart.loading || cart.error) && !uncertain && (
          <div
            className="mt-8 rounded-xl border border-[#eee5e0] bg-white p-5 dark:border-[#3a3431] dark:bg-[#292524]"
            role="status"
          >
            <p>{cart.error ? t("cartLoadError") : t("checking")}</p>
            {cart.error && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void cart.refresh()}
                className="mt-3"
              >
                {t("retryCart")}
              </Button>
            )}
          </div>
        )}

        {cart.unauthenticated ? (
          <div className="mt-8 rounded-2xl border border-[#eee5e0] bg-white p-6 dark:border-[#3a3431] dark:bg-[#292524]">
            <p>{t("errors.session")}</p>
            <Button asChild className="mt-4">
              <Link href={`/sign-in?returnTo=${encodeURIComponent(`/${locale}/checkout`)}`}>
                {t("signIn")}
              </Link>
            </Button>
          </div>
        ) : !cart.loading && !cart.error && cart.items.length === 0 && !uncertain ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-[#eee5e0] bg-white px-6 py-14 text-center dark:border-[#3a3431] dark:bg-[#292524]">
            <ShoppingBag className="mb-4 size-10 text-[#a97872]" aria-hidden="true" />
            <p>{t("emptyCart")}</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/cart">{t("backToCart")}</Link>
            </Button>
          </div>
        ) : cart.items.length > 0 || uncertain ? (
          <form
            onSubmit={(event) => void submit(event)}
            noValidate
            className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
          >
            <div className="min-w-0 space-y-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  <p>{t(`errors.${error}`)}</p>
                  {(error === "stock" ||
                    error === "expired" ||
                    error === "unavailable" ||
                    error === "changed") && (
                    <Link
                      href="/cart"
                      className="mt-2 inline-block font-semibold underline underline-offset-4"
                    >
                      {t("reviewCart")}
                    </Link>
                  )}
                </div>
              )}
              {uncertain && (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {t("retrySameDetails")}
                </p>
              )}

              <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-7 dark:border-[#3a3431] dark:bg-[#292524]">
                <h2 className="text-xl font-semibold">{t("deliveryTitle")}</h2>
                <fieldset
                  disabled={submitting || uncertain || completed}
                  className="mt-6 grid gap-5 sm:grid-cols-2"
                >
                  <div className={fieldClass}>
                    <Label htmlFor="checkout-name">{t("fullName")}</Label>
                    <Input
                      id="checkout-name"
                      name="customerName"
                      autoComplete="name"
                      required
                      maxLength={120}
                      value={form.customerName}
                      onChange={(event) => updateField("customerName", event.target.value)}
                      aria-invalid={!!fieldErrors.customerName}
                      className={inputClass}
                    />
                    {fieldError("customerName")}
                  </div>
                  <div className={fieldClass}>
                    <Label htmlFor="checkout-phone">{t("phone")}</Label>
                    <Input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      dir="ltr"
                      required
                      maxLength={25}
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      aria-invalid={!!fieldErrors.phone}
                      className={inputClass}
                    />
                    {fieldError("phone")}
                  </div>
                  <div className={fieldClass}>
                    <Label htmlFor="checkout-region">{t("region")}</Label>
                    <Select
                      value={form.region}
                      onValueChange={(value) =>
                        updateField("region", value as CheckoutInput["region"])
                      }
                      disabled={submitting || uncertain || completed}
                    >
                      <SelectTrigger
                        id="checkout-region"
                        aria-invalid={!!fieldErrors.region}
                        className={`${inputClass} w-full`}
                      >
                        <SelectValue placeholder={t("chooseRegion")} />
                      </SelectTrigger>
                      <SelectContent dir={locale === "ar" ? "rtl" : "ltr"}>
                        {(["west_bank", "jerusalem", "inside_48"] as const).map((region) => (
                          <SelectItem key={region} value={region}>
                            {t(`regions.${region}`)} · {currency(shippingFees[region])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError("region")}
                  </div>
                  <div className={fieldClass}>
                    <Label htmlFor="checkout-city">{t("city")}</Label>
                    <Input
                      id="checkout-city"
                      name="city"
                      autoComplete="address-level2"
                      required
                      maxLength={120}
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      aria-invalid={!!fieldErrors.city}
                      className={inputClass}
                    />
                    {fieldError("city")}
                  </div>
                  <div className={`${fieldClass} sm:col-span-2`}>
                    <Label htmlFor="checkout-address">{t("address")}</Label>
                    <Textarea
                      id="checkout-address"
                      name="address"
                      autoComplete="street-address"
                      required
                      maxLength={500}
                      rows={3}
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      aria-invalid={!!fieldErrors.address}
                      className="min-h-28 rounded-xl border-[#eee5e0] bg-white p-4 dark:border-[#3a3431] dark:bg-[#292524]"
                    />
                    <p className="text-xs text-[#817571] dark:text-[#aaa09b]">{t("addressHint")}</p>
                    {fieldError("address")}
                  </div>
                  <div className={`${fieldClass} sm:col-span-2`}>
                    <Label htmlFor="checkout-notes">{t("notes")}</Label>
                    <Textarea
                      id="checkout-notes"
                      name="notes"
                      maxLength={1000}
                      rows={3}
                      value={form.notes}
                      onChange={(event) => updateField("notes", event.target.value)}
                      aria-invalid={!!fieldErrors.notes}
                      className="min-h-24 rounded-xl border-[#eee5e0] bg-white p-4 dark:border-[#3a3431] dark:bg-[#292524]"
                    />
                    {fieldError("notes")}
                  </div>
                </fieldset>
              </section>

              <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-7 dark:border-[#3a3431] dark:bg-[#292524]">
                <h2 className="text-xl font-semibold">{t("paymentTitle")}</h2>
                <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#a97872]/50 bg-[#f8eeeb] p-4 dark:border-[#d4a39b]/50 dark:bg-[#3b2d2b]">
                  <Wallet
                    className="size-6 shrink-0 text-[#a97872] dark:text-[#d4a39b]"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{t("cashOnDelivery")}</p>
                    <p className="mt-1 text-xs text-[#817571] dark:text-[#aaa09b]">
                      {t("cashHint")}
                    </p>
                  </div>
                  <Check className="size-5 text-[#a97872] dark:text-[#d4a39b]" aria-hidden="true" />
                </div>
              </section>
            </div>

            <aside className="min-w-0 rounded-2xl border border-[#eee5e0] bg-white p-5 sm:p-6 lg:sticky lg:top-28 dark:border-[#3a3431] dark:bg-[#292524]">
              <h2 className="text-xl font-semibold">{t("summaryTitle")}</h2>
              <ul className="mt-5 space-y-4">
                {summary.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 border-b border-[#eee5e0] pb-4 dark:border-[#3a3431]"
                  >
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eee5e0] dark:bg-[#3a3431]">
                      <ProductImage
                        src={item.image}
                        alt={item.name[locale]}
                        placeholder={t("imagePlaceholder")}
                        sizes="64px"
                        compact
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold wrap-anywhere">{item.name[locale]}</p>
                      <p className="mt-1 text-xs text-[#817571] dark:text-[#aaa09b]">
                        <bdi>{item.size}</bdi> · {item.color[locale]} ·{" "}
                        {t("quantity", { count: item.quantity })}
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        <bdi>{currency(item.lineTotal)}</bdi>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span>{t("subtotal")}</span>
                  <bdi>{currency(summary.subtotal)}</bdi>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <Truck className="size-4" aria-hidden="true" />
                    {t("shipping")}
                  </span>
                  <bdi>{fee === null ? t("chooseRegion") : currency(fee)}</bdi>
                </div>
                <div className="flex justify-between gap-4 border-t border-[#eee5e0] pt-4 text-lg font-semibold dark:border-[#3a3431]">
                  <span>{t("total")}</span>
                  <bdi>{fee === null ? t("chooseRegion") : currency(summary.subtotal + fee)}</bdi>
                </div>
              </div>
              <p className="mt-3 text-xs leading-6 text-[#817571] dark:text-[#aaa09b]">
                {t("estimateNotice")}
              </p>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  completed ||
                  cart.busy ||
                  (!uncertain && (cart.loading || !!cart.error)) ||
                  (!uncertain && unavailable) ||
                  (!uncertain && cart.items.length === 0)
                }
                className="mt-6 h-12 w-full rounded-xl bg-[#a97872] text-white hover:bg-[#91645e] dark:bg-[#d4a39b] dark:text-[#171717] dark:hover:bg-[#e4b7af]"
              >
                {t(submitting ? "submitting" : uncertain ? "retryOrder" : "confirmOrder")}
              </Button>
            </aside>
          </form>
        ) : null}
      </div>
    </main>
  );
}
