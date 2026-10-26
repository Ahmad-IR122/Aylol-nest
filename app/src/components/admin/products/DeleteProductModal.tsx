"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import type { ProductErrorCode } from "@/lib/products/client";
import { ProductModal, ProductNotice, mutedClass, secondaryClass } from "./ProductUi";

export default function DeleteProductModal({
  product,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  product: Product;
  saving: boolean;
  error?: ProductErrorCode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Products");
  const language = useLocale() === "ar" ? "ar" : "en";
  return (
    <ProductModal
      title={t("deleteTitle")}
      description={t("deleteQuestion")}
      busy={saving}
      onClose={onClose}
    >
      <AlertTriangle className="text-red-600 dark:text-red-300" size={32} />
      <p className="text-lg font-semibold wrap-anywhere">{product.name[language]}</p>
      <p className={`text-sm leading-relaxed ${mutedClass}`}>{t("deleteWarning")}</p>
      {error && <ProductNotice>{t(`errors.${error}`)}</ProductNotice>}
      <div className="mt-2 flex justify-end gap-3">
        <Button
          variant="outline"
          className={secondaryClass}
          disabled={saving}
          onClick={onClose}
          autoFocus
        >
          {t("cancel")}
        </Button>
        <Button
          className="min-h-11 rounded-xl bg-red-700 px-5 text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700"
          disabled={saving}
          onClick={onConfirm}
        >
          {saving && <LoaderCircle className="animate-spin" />}
          {t(saving ? "deleting" : "delete")}
        </Button>
      </div>
    </ProductModal>
  );
}
