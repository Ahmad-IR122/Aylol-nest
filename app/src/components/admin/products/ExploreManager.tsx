"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productErrorCode, productRequest, type ProductErrorCode } from "@/lib/products/client";
import type { ProductList } from "@/types/product";
import { ProductNotice, mutedClass, panelClass, primaryClass, secondaryClass } from "./ProductUi";

type Item = {
  id: string;
  name: { ar: string; en: string };
  slug: string;
  isActive: boolean;
  image: string | null;
};
type Selection = { revision: number; productIds: string[]; products: Item[] };

export default function ExploreManager() {
  const t = useTranslations("AdminExplore");
  const productsText = useTranslations("Products");
  const locale = useLocale() === "en" ? "en" : "ar";
  const [items, setItems] = useState<Item[]>([]);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<ProductList>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<ProductErrorCode>();
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await productRequest<Selection>("/api/admin/explore", { signal });
      if (signal?.aborted) return;
      // Deleted product references are absent from products and removed on save.
      setItems(data.products);
      setRevision(data.revision);
      setDirty(data.products.length !== data.productIds.length);
      setError(undefined);
    } catch (cause) {
      if (!signal?.aborted) setError(productErrorCode(cause));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12", isActive: "true" });
        if (search.trim()) params.set("search", search.trim());
        const data = await productRequest<ProductList>(`/api/admin/products?${params}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setCatalog(data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(productErrorCode(cause));
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, page]);

  function add(product: ProductList["products"][number]) {
    if (items.some((item) => item.id === product._id) || items.length >= 200) return;
    setItems((current) => [
      ...current,
      {
        id: product._id,
        name: product.name,
        slug: product.slug,
        isActive: product.isActive,
        image: product.images[0]?.url ?? null,
      },
    ]);
    setDirty(true);
    setSaved(false);
  }
  function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setDirty(true);
    setSaved(false);
  }
  function move(index: number, offset: number) {
    setItems((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
    setDirty(true);
    setSaved(false);
  }
  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      const result = await productRequest<{ revision: number }>("/api/admin/explore", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision, productIds: items.map((item) => item.id) }),
      });
      setRevision(result.revision);
      setDirty(false);
      setSaved(true);
    } catch (cause) {
      setError(productErrorCode(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="explore" className={`${panelClass} space-y-5 p-5`} aria-label={t("title")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>{t("description")}</p>
        </div>
        <Button
          className={primaryClass}
          onClick={() => void save()}
          disabled={!dirty || saving || loading}
        >
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
      {error && (
        <ProductNotice>
          {error === "conflict" ? t("conflict") : productsText(`errors.${error}`)}{" "}
          <Button
            variant="ghost"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            {t("reload")}
          </Button>
        </ProductNotice>
      )}
      {saved && <ProductNotice success>{t("saved")}</ProductNotice>}
      {loading ? (
        <p className={mutedClass}>{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className={mutedClass}>{t("empty")}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eee5e0] p-3 dark:border-[#3a3431]"
            >
              <span className="w-7 text-center font-semibold">{index + 1}</span>
              <span className="min-w-0 flex-1 font-medium">
                {item.name[locale]}
                {!item.isActive && (
                  <span className={`ms-2 text-xs ${mutedClass}`}>({t("inactive")})</span>
                )}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label={`${t("up")}: ${item.name[locale]}`}
                disabled={index === 0 || saving}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={17} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={`${t("down")}: ${item.name[locale]}`}
                disabled={index === items.length - 1 || saving}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={17} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={`${t("remove")}: ${item.name[locale]}`}
                disabled={saving}
                onClick={() => remove(item.id)}
              >
                <Trash2 size={17} />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <div className="border-t border-[#eee5e0] pt-5 dark:border-[#3a3431]">
        <h3 className="mb-3 font-semibold">{t("addProducts")}</h3>
        <label className="block text-sm">
          {t("search")}
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            maxLength={200}
            className="mt-1 min-h-11 w-full rounded-xl border border-[#eee5e0] bg-white px-3 dark:border-[#3a3431] dark:bg-[#211e1c]"
          />
        </label>
        {searching && <p className={`mt-3 ${mutedClass}`}>{t("loading")}</p>}
        <ul className="mt-3 space-y-2">
          {catalog?.products
            .filter((product) => !items.some((item) => item.id === product._id))
            .map((product) => (
              <li
                key={product._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#eee5e0] p-3 dark:border-[#3a3431]"
              >
                <span className="min-w-0">{product.name[locale]}</span>
                <Button
                  className={secondaryClass}
                  disabled={saving || items.length >= 200}
                  onClick={() => add(product)}
                  aria-label={`${t("add")}: ${product.name[locale]}`}
                >
                  <Plus size={17} />
                  {t("add")}
                </Button>
              </li>
            ))}
        </ul>
        {catalog && catalog.pagination.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {t("previous")}
            </Button>
            <span>
              {page} / {catalog.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= catalog.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
