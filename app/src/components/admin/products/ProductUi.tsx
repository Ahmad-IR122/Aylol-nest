"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { ImageOff, X } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const panelClass =
  "rounded-2xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]";
export const mutedClass = "text-[#817571] dark:text-[#aaa09b]";
export const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-[#eee5e0] bg-white px-3 py-2 text-sm text-[#352d2b] outline-none focus-visible:ring-2 focus-visible:ring-[#a97872] disabled:opacity-50 dark:border-[#3a3431] dark:bg-[#211e1c] dark:text-[#f5efec]";
export const primaryClass =
  "min-h-11 rounded-xl bg-[#a97872] px-5 text-white hover:bg-[#93635d] dark:bg-[#d4a39b] dark:text-[#211e1c] dark:hover:bg-[#e2b8b0]";
export const secondaryClass =
  "min-h-11 rounded-xl border border-[#eee5e0] bg-transparent px-4 text-[#352d2b] hover:bg-[#faf8f6] dark:border-[#3a3431] dark:text-[#f5efec] dark:hover:bg-[#3a3431]";
export const ValidationContext = createContext<string[]>([]);
export const ProductModalFocusContext = createContext<(() => void) | null>(null);

export function ProductField({
  label,
  name,
  multiline,
  onTextChange,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  multiline?: boolean;
  onTextChange?: (value: string) => void;
  hint?: string;
}) {
  const id = useId();
  const invalid = useContext(ValidationContext).includes(name);
  const className = `${inputClass} ${invalid ? "border-red-500 ring-1 ring-red-500" : ""}`;
  return (
    <label htmlFor={id} className="block min-w-0 space-y-2 text-sm font-medium">
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>
      {multiline ? (
        <Textarea
          id={id}
          name={name}
          rows={3}
          value={String(props.value ?? "")}
          dir={props.dir}
          onChange={(event) => onTextChange?.(event.target.value)}
          className={className}
          aria-invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      ) : (
        <Input
          {...props}
          id={id}
          name={name}
          className={className}
          aria-invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      )}
      {hint && (
        <span
          id={`${id}-hint`}
          className={`block text-xs leading-relaxed font-normal ${mutedClass}`}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

export function ProductSelect({
  label,
  name,
  value,
  onChange,
  children,
  required,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  const invalid = useContext(ValidationContext).includes(name);
  return (
    <label className="block min-w-0 space-y-2 text-sm font-medium">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={invalid}
        className={`${inputClass} ${invalid ? "border-red-500 ring-1 ring-red-500" : ""}`}
      >
        {children}
      </select>
    </label>
  );
}

export function ProductCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-[#a97872] focus-visible:outline-2 focus-visible:outline-offset-4"
      />
      {label}
    </label>
  );
}

export function ProductNotice({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return (
    <div
      role={success ? "status" : "alert"}
      className={`rounded-xl border p-4 text-sm leading-relaxed ${success ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"}`}
    >
      {children}
    </div>
  );
}

export function ProductThumbnail({
  url,
  alt,
  large = false,
}: {
  url?: string;
  alt: string;
  large?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState("");
  const t = useTranslations("Products");
  let safeUrl: string | undefined;
  try {
    const parsed = new URL(url ?? "");
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) safeUrl = parsed.href;
  } catch {
    // Incomplete URLs are expected while the administrator types.
  }
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4ede8] dark:bg-[#211e1c] ${large ? "aspect-square w-full" : "size-14"}`}
    >
      {safeUrl && safeUrl !== failedUrl ? (
        <Image
          src={safeUrl}
          alt={alt}
          fill
          unoptimized
          sizes={large ? "240px" : "56px"}
          className="object-cover"
          onError={() => setFailedUrl(safeUrl)}
        />
      ) : (
        <span role="img" aria-label={t("noImage")} className={mutedClass}>
          <ImageOff size={large ? 32 : 20} />
        </span>
      )}
    </div>
  );
}

export function ProductModal({
  title,
  description,
  busy = false,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Products");
  const restoreFocus = useContext(ProductModalFocusContext);
  const [opener] = useState(() =>
    typeof document !== "undefined" ? document.activeElement : null,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`max-h-[92dvh] overflow-y-auto bg-[#faf8f6] p-5 text-[#352d2b] sm:p-7 dark:bg-[#292524] dark:text-[#f5efec] ${wide ? "sm:max-w-4xl" : "sm:max-w-xl"}`}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (restoreFocus) restoreFocus();
          else if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className={description ? mutedClass : "sr-only"}>
              {description ?? title}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-11 shrink-0"
            onClick={onClose}
            disabled={busy}
            aria-label={t("close")}
          >
            <X />
          </Button>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
