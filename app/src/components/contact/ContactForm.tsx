"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema } from "@/lib/contact/validation";

type Field = "fullName" | "email" | "phone" | "subject" | "message";
const fields: Field[] = ["fullName", "email", "phone", "subject", "message"];

export default function ContactForm() {
  const t = useTranslations("ContactPage");
  const [values, setValues] = useState<Record<Field, string>>({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rateLimited">(
    "idle",
  );
  const [website, setWebsite] = useState("");
  const pending = useRef(false);
  const key = useRef<string | null>(null);

  function update(field: Field, value: string) {
    key.current = null;
    setStatus("idle");
    setErrors((current) => ({ ...current, [field]: false }));
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const parsed = contactSchema.safeParse({
      ...values,
      website,
      submissionKey: crypto.randomUUID(),
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], true])));
      return;
    }
    setErrors({});
    pending.current = true;
    setStatus("loading");
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website, submissionKey: key.current }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (Array.isArray(result.fields))
          setErrors(
            Object.fromEntries(
              result.fields
                .filter((field: string) => fields.includes(field as Field))
                .map((field: string) => [field, true]),
            ),
          );
        setStatus(result.code === "rateLimited" ? "rateLimited" : "error");
        return;
      }
      key.current = null;
      setValues({ fullName: "", email: "", phone: "", subject: "", message: "" });
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      pending.current = false;
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className="space-y-5 rounded-2xl border border-[#DCCFC1] bg-white p-6 shadow-sm sm:p-8 dark:border-stone-700 dark:bg-stone-900"
    >
      <h2 className="text-2xl font-semibold">{t("formTitle")}</h2>
      {fields.map((field) => (
        <div key={field}>
          <label htmlFor={`contact-${field}`} className="mb-2 block text-sm font-medium">
            {t(field)}
            {field !== "phone" && " *"}
          </label>
          {field === "message" ? (
            <Textarea
              id={`contact-${field}`}
              name={field}
              value={values[field]}
              onChange={(event) => update(field, event.target.value)}
              maxLength={3000}
              rows={6}
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `error-${field}` : undefined}
              required
              className="min-h-36"
            />
          ) : (
            <Input
              id={`contact-${field}`}
              name={field}
              type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
              autoComplete={
                field === "fullName"
                  ? "name"
                  : field === "email"
                    ? "email"
                    : field === "phone"
                      ? "tel"
                      : "off"
              }
              value={values[field]}
              onChange={(event) => update(field, event.target.value)}
              maxLength={
                field === "email" ? 254 : field === "phone" ? 25 : field === "subject" ? 150 : 120
              }
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `error-${field}` : undefined}
              required={field !== "phone"}
              className="h-11"
            />
          )}
          {errors[field] && (
            <p id={`error-${field}`} className="mt-1 text-sm text-red-700 dark:text-red-300">
              {t(`validation.${field}`)}
            </p>
          )}
        </div>
      ))}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={status === "loading"}
        className="h-11 w-full bg-[#8A6B60] text-white hover:bg-[#71574E] dark:bg-[#B79284] dark:text-stone-950"
      >
        {t(status === "loading" ? "submitting" : "submit")}
      </Button>
      {status !== "idle" && status !== "loading" && (
        <p
          role="status"
          className={
            status === "success"
              ? "text-green-800 dark:text-green-200"
              : "text-red-700 dark:text-red-300"
          }
        >
          {t(status)}
        </p>
      )}
    </form>
  );
}
