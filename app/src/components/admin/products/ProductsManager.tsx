"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { LoaderCircle, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/admin/useProducts";
import { productErrorCode, type ProductErrorCode } from "@/lib/products/client";
import type { Product, ProductFilters, ProductInput, ProductUpdate } from "@/types/product";
import ProductFormModal from "./ProductFormModal";
import ProductDetailsModal from "./ProductDetailsModal";
import DeleteProductModal from "./DeleteProductModal";
import ProductsTable from "./ProductsTable";
import {
  ProductModal,
  ProductModalFocusContext,
  ProductNotice,
  ProductSelect,
  inputClass,
  mutedClass,
  panelClass,
  primaryClass,
} from "./ProductUi";

const initialFilters: ProductFilters = {
  search: "",
  category: "",
  isActive: "",
  sort: "createdAt",
  page: 1,
};
type Modal =
  | { kind: "create" }
  | { kind: "edit" | "details"; product?: Product; id: string; error?: ProductErrorCode }
  | { kind: "delete"; product: Product }
  | null;

export default function ProductsManager() {
  const t = useTranslations("Products");
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const correctPage = useCallback(
    (page: number) => setFilters((value) => ({ ...value, page })),
    [],
  );
  const api = useProducts(filters, correctPage);
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState<ProductErrorCode>();
  const [success, setSuccess] = useState("");
  const detailRequest = useRef<AbortController | null>(null);
  const opener = useRef<Element | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => () => detailRequest.current?.abort(), []);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((value) => (value.search === search ? value : { ...value, search, page: 1 })),
      350,
    );
    return () => clearTimeout(timer);
  }, [search]);

  function changeFilter(field: "category" | "isActive" | "sort", value: string) {
    setFilters((previous) => ({ ...previous, [field]: value, page: 1 }));
  }
  function clearMessages() {
    setError(undefined);
    setSuccess("");
  }
  function close() {
    if (!api.saving) {
      detailRequest.current?.abort();
      setModal(null);
      setError(undefined);
    }
  }
  function create() {
    opener.current = document.activeElement;
    clearMessages();
    setModal({ kind: "create" });
  }
  async function openProduct(id: string, kind: "edit" | "details") {
    if (!modal) opener.current = document.activeElement;
    clearMessages();
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setModal({ kind, id });
    try {
      const product = await api.getProduct(id, controller.signal);
      if (!controller.signal.aborted) setModal({ kind, id, product });
    } catch (error) {
      if (!controller.signal.aborted) setModal({ kind, id, error: productErrorCode(error) });
    }
  }
  async function save(payload: ProductInput | ProductUpdate | null) {
    if (!modal || (modal.kind !== "create" && modal.kind !== "edit")) return;
    if (!payload) {
      setSuccess("unchanged");
      setModal(null);
      return;
    }
    await api.mutate(
      modal.kind === "create" ? "POST" : "PATCH",
      modal.kind === "edit" ? modal.id : undefined,
      payload,
    );
    setSuccess(modal.kind === "create" ? "created" : "saved");
    setModal(null);
  }
  async function remove() {
    if (modal?.kind !== "delete") return;
    setError(undefined);
    try {
      await api.mutate("DELETE", modal.product._id);
      if (api.data?.products.length === 1 && filters.page > 1)
        setFilters((value) => ({ ...value, page: value.page - 1 }));
      setModal(null);
      setSuccess("deleted");
    } catch (error) {
      setError(productErrorCode(error));
    }
  }
  async function toggle(product: Product) {
    clearMessages();
    try {
      await api.mutate("PATCH", product._id, { isActive: !product.isActive });
      if (filters.isActive && api.data?.products.length === 1 && filters.page > 1)
        setFilters((value) => ({ ...value, page: value.page - 1 }));
      setSuccess("statusChanged");
    } catch (error) {
      setError(productErrorCode(error));
    }
  }
  function reset() {
    setSearch("");
    setFilters({ ...initialFilters, sort: filters.sort });
  }
  const displayError = error ?? api.error;
  const filtered = !!(filters.search || filters.category || filters.isActive);
  function restoreFocus() {
    requestAnimationFrame(() => {
      // Loading/details/form transitions may mount the next dialog immediately.
      if (document.querySelector('[data-slot="dialog-content"]')) return;
      if (opener.current instanceof HTMLElement && opener.current.isConnected)
        opener.current.focus();
      else addButton.current?.focus();
    });
  }
  return (
    <ProductModalFocusContext value={restoreFocus}>
      <main
        className="min-h-dvh min-w-0 bg-[#faf8f6] px-4 py-8 text-[#352d2b] md:px-8 dark:bg-[#171717] dark:text-[#f5efec]"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="mb-2 text-sm font-medium text-[#a97872] dark:text-[#d4a39b]">
                {t("eyebrow")}
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
              <p className={`mt-2 text-sm ${mutedClass}`}>{t("subtitle")}</p>
            </div>
            <Button ref={addButton} onClick={create} disabled={api.saving} className={primaryClass}>
              <Plus />
              {t("add")}
            </Button>
          </header>
          {success && (
            <ProductNotice success>
              <div className="flex items-center justify-between gap-3">
                <span>{t(success)}</span>
                <Button
                  variant="ghost"
                  className="size-9"
                  onClick={() => setSuccess("")}
                  aria-label={t("dismiss")}
                >
                  <X />
                </Button>
              </div>
            </ProductNotice>
          )}
          {displayError && modal?.kind !== "delete" && (
            <ProductNotice>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{t(`errors.${displayError}`)}</span>
                {displayError === "unauthorized" ? (
                  <Link className="underline" href={`/${locale}/sign-in`}>
                    {t("signIn")}
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setError(undefined);
                      api.refresh();
                    }}
                  >
                    {t("retry")}
                  </Button>
                )}
              </div>
            </ProductNotice>
          )}
          <section
            aria-label={t("search")}
            className={`${panelClass} grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]`}
          >
            <label className="block min-w-0 space-y-2 text-sm font-medium">
              <span>{t("search")}</span>
              <div className="relative">
                <Search
                  size={18}
                  className={`pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 ${mutedClass}`}
                />
                <input
                  type="search"
                  value={search}
                  maxLength={200}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("search")}
                  className={`${inputClass} ps-10`}
                />
              </div>
            </label>
            <ProductSelect
              label={t("category")}
              name="category-filter"
              value={filters.category}
              onChange={(value) => changeFilter("category", value)}
              disabled={api.categoriesLoading}
            >
              <option value="">{t("allCategories")}</option>
              {api.categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name[language]}
                </option>
              ))}
            </ProductSelect>
            <ProductSelect
              label={t("status")}
              name="status-filter"
              value={filters.isActive}
              onChange={(value) => changeFilter("isActive", value)}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="true">{t("active")}</option>
              <option value="false">{t("inactive")}</option>
            </ProductSelect>
            <ProductSelect
              label={t("sort")}
              name="sort-filter"
              value={filters.sort}
              onChange={(value) => changeFilter("sort", value)}
            >
              <option value="createdAt">{t("newest")}</option>
              <option value="updatedAt">{t("updated")}</option>
              <option value={`name.${language}`}>{t("alphabetical")}</option>
            </ProductSelect>
            {filtered && (
              <Button
                variant="link"
                className="min-h-11 justify-self-start text-[#a97872] dark:text-[#d4a39b]"
                onClick={reset}
              >
                {t("reset")}
              </Button>
            )}
          </section>
          {api.categoriesError && (
            <ProductNotice>
              {t(`errors.${api.categoriesError}`)}{" "}
              <Button variant="ghost" onClick={api.refreshCategories}>
                {t("retry")}
              </Button>
            </ProductNotice>
          )}
          {!api.error && (
            <ProductsTable
              data={api.data}
              loading={api.loading}
              disabled={api.saving || modal !== null}
              filtered={filtered}
              page={filters.page}
              onPage={(page) => setFilters((value) => ({ ...value, page }))}
              onRefresh={api.refresh}
              onAdd={create}
              onReset={reset}
              onDetails={(product) => void openProduct(product._id, "details")}
              onEdit={(product) => void openProduct(product._id, "edit")}
              onDelete={(product) => {
                opener.current = document.activeElement;
                clearMessages();
                setModal({ kind: "delete", product });
              }}
              onToggle={(product) => void toggle(product)}
            />
          )}
        </div>
        {(modal?.kind === "create" || (modal?.kind === "edit" && modal.product)) && (
          <ProductFormModal
            key={modal.kind === "create" ? "create" : modal.id}
            product={modal.kind === "edit" ? modal.product : undefined}
            categories={api.categories}
            categoriesLoading={api.categoriesLoading}
            categoriesError={api.categoriesError}
            onRefreshCategories={api.refreshCategories}
            saving={api.saving}
            onSave={save}
            onClose={close}
          />
        )}
        {(modal?.kind === "edit" || modal?.kind === "details") && !modal.product && (
          <ProductModal
            title={t(modal.kind === "edit" ? "editTitle" : "detailsTitle")}
            onClose={close}
          >
            {modal.error ? (
              <ProductNotice>
                {t(`errors.${modal.error}`)}{" "}
                <Button variant="ghost" onClick={() => void openProduct(modal.id, modal.kind)}>
                  {t("retry")}
                </Button>
              </ProductNotice>
            ) : (
              <p role="status" className={`flex items-center gap-3 py-10 ${mutedClass}`}>
                <LoaderCircle className="animate-spin" />
                {t("loadingDetails")}
              </p>
            )}
          </ProductModal>
        )}
        {modal?.kind === "details" && modal.product && (
          <ProductDetailsModal
            product={modal.product}
            onClose={close}
            onEdit={() => void openProduct(modal.id, "edit")}
          />
        )}
        {modal?.kind === "delete" && (
          <DeleteProductModal
            product={modal.product}
            saving={api.saving}
            error={error}
            onClose={close}
            onConfirm={() => void remove()}
          />
        )}
      </main>
    </ProductModalFocusContext>
  );
}
