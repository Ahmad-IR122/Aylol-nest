"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  id: string;
  locale: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
};

export default function CustomerActions({
  id,
  locale,
  firstName,
  lastName,
  phone,
  isActive,
}: Props) {
  const router = useRouter();
  const t = useTranslations("AdminCustomers");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [name, setName] = useState(firstName);
  const [surname, setSurname] = useState(lastName);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [active, setActive] = useState(isActive);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const normalizedPhone = phoneNumber.trim();
    if (normalizedPhone && !/^(?:059|056)[0-9]{7}$/.test(normalizedPhone)) {
      setError(t("phoneHint"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name,
          lastName: surname,
          phone: normalizedPhone,
          isActive: active,
        }),
      });
      if (!response.ok) throw new Error("Update failed");
      const result = (await response.json()) as { identityMissing?: boolean };
      if (result.identityMissing) {
        setActive(false);
        setNotice(t("identityMissing"));
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setDeleteError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      router.push(`/${locale}/admin/customers`);
      router.refresh();
    } catch {
      setDeleteError(t("deleteError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#eee5e0] bg-white p-5 dark:border-[#3a3431] dark:bg-[#292524]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{t("manageCustomer")}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing((value) => !value)}
            className="min-h-10 rounded-xl border border-[#eee5e0] px-4 text-sm font-medium disabled:opacity-50 dark:border-[#3a3431]"
          >
            {t(editing ? "cancelEdit" : "editCustomer")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDeleteError("");
              setDeleteOpen(true);
            }}
            className="min-h-10 rounded-xl border border-rose-300 px-4 text-sm font-medium text-rose-700 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300"
          >
            {t("deleteCustomer")}
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {notice}
        </p>
      )}
      {editing && (
        <form onSubmit={(event) => void save(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="block font-medium">{t("firstName")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-transparent px-3 dark:border-[#3a3431]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block font-medium">{t("lastName")}</span>
            <input
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
              maxLength={100}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-transparent px-3 dark:border-[#3a3431]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block font-medium">{t("phone")}</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              maxLength={10}
              placeholder={t("phonePlaceholder")}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-transparent px-3 dark:border-[#3a3431]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="block font-medium">{t("status")}</span>
            <select
              value={active ? "active" : "inactive"}
              onChange={(event) => setActive(event.target.value === "active")}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-white px-3 dark:border-[#3a3431] dark:bg-[#211e1c]"
            >
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-xl bg-[#a97872] px-5 font-medium text-white disabled:opacity-50 dark:bg-[#d4a39b] dark:text-[#171717]"
            >
              {t(busy ? "saving" : "saveChanges")}
            </button>
          </div>
        </form>
      )}
      <p className="mt-4 text-xs text-[#817571] dark:text-[#aaa09b]">{t("contactNote")}</p>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!busy) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="w-[calc(100%-2rem)] border border-[#eee5e0] bg-white text-[#352d2b] shadow-xl dark:border-[#3a3431] dark:bg-[#292524] dark:text-[#f5efec]"
        >
          <AlertDialogHeader className="place-items-start text-start sm:place-items-start sm:text-start">
            <AlertDialogTitle className="font-semibold">{t("deleteCustomer")}</AlertDialogTitle>
            <AlertDialogDescription className="text-[#817571] dark:text-[#aaa09b]">
              {t("confirmDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {deleteError}
            </p>
          )}
          <AlertDialogFooter className="border-[#eee5e0] bg-[#faf8f6] dark:border-[#3a3431] dark:bg-[#211e1c]">
            <AlertDialogCancel
              disabled={busy}
              className="min-h-10 rounded-xl border-[#eee5e0] dark:border-[#3a3431]"
            >
              {t("cancelEdit")}
            </AlertDialogCancel>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="min-h-10 rounded-xl bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 dark:bg-rose-700 dark:hover:bg-rose-600"
            >
              {t(busy ? "deleting" : "deleteCustomer")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
