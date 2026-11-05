"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, LoaderCircle, Search } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import ProductImage from "@/components/home/ProductImage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { orderStatuses, orderStatusTransitions, type OrderStatus } from "@/lib/orders/status";
import type { AdminOrder, AdminOrderList, AdminOrderSummary } from "@/types/admin-order";

type ErrorCode =
  "unauthorized" | "forbidden" | "notFound" | "conflict" | "invalid" | "network" | "server";

class OrderRequestError extends Error {
  constructor(public code: ErrorCode) {
    super(code);
  }
}

async function orderRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort, { once: true });
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...options, signal: controller.signal });
    if (!response.ok) {
      const code: ErrorCode =
        response.status === 401
          ? "unauthorized"
          : response.status === 403
            ? "forbidden"
            : response.status === 404
              ? "notFound"
              : response.status === 409
                ? "conflict"
                : response.status === 400
                  ? "invalid"
                  : "server";
      throw new OrderRequestError(code);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new OrderRequestError("server");
    }
  } catch (error) {
    if (error instanceof OrderRequestError) throw error;
    if (options?.signal?.aborted) throw error;
    if (controller.signal.aborted) throw new OrderRequestError("network");
    throw new OrderRequestError("network");
  } finally {
    window.clearTimeout(timeout);
    options?.signal?.removeEventListener("abort", onAbort);
  }
}

function errorCode(error: unknown): ErrorCode {
  return error instanceof OrderRequestError ? error.code : "server";
}

function statusClass(status: OrderStatus) {
  if (status === "delivered")
    return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (status === "cancelled")
    return "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  return "bg-[#f8eeeb] text-[#704c47] dark:bg-[#3b2d2b] dark:text-[#e2ada4]";
}

export default function OrdersManager() {
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const t = useTranslations("AdminOrders");
  const format = useFormatter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState<AdminOrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<ErrorCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<ErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [notice, setNotice] = useState("");
  const detailRequest = useRef<AbortController | null>(null);
  const mutationLock = useRef(false);

  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "ILS", currencyDisplay: "narrowSymbol" });
  const date = (value: string) =>
    format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Hebron",
    });
  const query = new URLSearchParams({ page: String(page), limit: "12" });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  const queryString = query.toString();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setListError(null);
      orderRequest<AdminOrderList>(`/api/admin/orders?${queryString}`, {
        signal: controller.signal,
      })
        .then((data) => {
          if (controller.signal.aborted) return;
          const lastPage = Math.max(1, data.pagination.totalPages);
          if (page > lastPage) setPage(lastPage);
          else setList(data);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setListError(errorCode(error));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [queryString, page, revision]);

  useEffect(() => () => detailRequest.current?.abort(), []);

  async function openOrder(id: string) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelectedId(id);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    setNextStatus("");
    try {
      const data = await orderRequest<{ order: AdminOrder }>(`/api/admin/orders/${id}`, {
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setDetail(data.order);
    } catch (error) {
      if (!controller.signal.aborted) setDetailError(errorCode(error));
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }

  function close() {
    if (saving) return;
    detailRequest.current?.abort();
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setNextStatus("");
  }

  async function saveStatus() {
    if (!detail || !nextStatus || mutationLock.current) return;
    if (nextStatus === "cancelled" && !window.confirm(t("confirmCancellation"))) return;
    mutationLock.current = true;
    setSaving(true);
    setDetailError(null);
    try {
      const data = await orderRequest<{ order: AdminOrder }>(`/api/admin/orders/${detail._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      setDetail(data.order);
      setNextStatus("");
      setRevision((value) => value + 1);
      setNotice(t("statusSaved"));
    } catch (error) {
      setDetailError(errorCode(error));
      // A failed response may follow a committed cancellation. Re-read before retrying.
      if (errorCode(error) === "server" || errorCode(error) === "network")
        void openOrder(detail._id);
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  const statusLabel = (value: OrderStatus) => t(`statuses.${value}`);
  const filtered = !!(search || status);
  const availableStatuses = detail
    ? orderStatusTransitions[detail.status].filter(
        (value) => value !== "cancelled" || detail.paymentStatus === "unpaid",
      )
    : [];

  return (
    <main className="min-w-0 p-5 md:p-8" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        </div>
        {notice && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {notice}
          </p>
        )}
        <section
          className="grid gap-4 rounded-2xl border border-[#eee5e0] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:p-5 dark:border-[#3a3431] dark:bg-[#292524]"
          aria-label={t("filters")}
        >
          <label className="block space-y-2 text-sm font-medium">
            <span>{t("search")}</span>
            <span className="relative block">
              <Search
                className="absolute start-3 top-3.5 size-4 text-[#817571]"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("searchPlaceholder")}
                maxLength={120}
                className="h-11 rounded-xl border-[#eee5e0] bg-transparent ps-10 dark:border-[#3a3431]"
              />
            </span>
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>{t("statusFilter")}</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-[#eee5e0] bg-white px-3 text-sm dark:border-[#3a3431] dark:bg-[#211e1c]"
            >
              <option value="">{t("allStatuses")}</option>
              {orderStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </section>

        {listError && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {t(`errors.${listError}`)}{" "}
            <Button
              variant="outline"
              className="ms-3 min-h-10"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t("retry")}
            </Button>
          </div>
        )}
        {loading ? (
          <p
            role="status"
            className="flex items-center gap-2 py-12 text-sm text-[#817571] dark:text-[#aaa09b]"
          >
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t("loading")}
          </p>
        ) : !listError && list?.orders.length === 0 ? (
          <div className="rounded-2xl border border-[#eee5e0] bg-white p-12 text-center dark:border-[#3a3431] dark:bg-[#292524]">
            <p>{t(filtered ? "noResults" : "empty")}</p>
          </div>
        ) : !listError && list ? (
          <section
            className="overflow-hidden rounded-2xl border border-[#eee5e0] bg-white dark:border-[#3a3431] dark:bg-[#292524]"
            aria-label={t("title")}
          >
            <div className="space-y-3 p-4 md:hidden">
              {list.orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  t={t}
                  currency={currency}
                  date={date}
                  onOpen={openOrder}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-start text-sm">
                <thead className="bg-[#faf8f6] text-xs text-[#817571] dark:bg-[#211e1c] dark:text-[#aaa09b]">
                  <tr>
                    {[
                      "orderNumber",
                      "customer",
                      "phone",
                      "date",
                      "total",
                      "paymentStatus",
                      "orderStatus",
                      "actions",
                    ].map((column) => (
                      <th key={column} scope="col" className="px-4 py-4 text-start font-medium">
                        {t(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.orders.map((order) => (
                    <tr key={order._id} className="border-t border-[#eee5e0] dark:border-[#3a3431]">
                      <td className="px-4 py-4 font-semibold">
                        <bdi>{order.orderNumber}</bdi>
                      </td>
                      <td className="px-4 py-4">{order.shippingAddress.fullName}</td>
                      <td className="px-4 py-4">
                        <bdi>{order.shippingAddress.phone}</bdi>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{date(order.createdAt)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <bdi>{currency(order.total)}</bdi>
                      </td>
                      <td className="px-4 py-4">{t(`paymentStatuses.${order.paymentStatus}`)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-10"
                          onClick={() => void openOrder(order._id)}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                          {t("viewDetails")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5e0] px-4 py-4 text-sm dark:border-[#3a3431]">
              <p>{t("results", { count: list.pagination.total })}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("previous")}
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft className="size-4 rtl:rotate-180" />
                </Button>
                <span>{t("pageOf", { page, total: Math.max(1, list.pagination.totalPages) })}</span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("next")}
                  disabled={page >= list.pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          dir={language === "ar" ? "rtl" : "ltr"}
          className="max-h-[90vh] w-full max-w-[calc(100%-2rem)] overflow-y-auto border-[#eee5e0] bg-white p-5 text-[#352d2b] sm:max-w-3xl sm:p-7 dark:border-[#3a3431] dark:bg-[#292524] dark:text-[#f5efec]"
        >
          <DialogTitle className="text-xl">
            {t("detailsTitle")}
            {detail ? ` · ${detail.orderNumber}` : ""}
          </DialogTitle>
          <DialogDescription>{t("detailsDescription")}</DialogDescription>
          {detailLoading && (
            <p role="status" className="flex items-center gap-2 py-10">
              <LoaderCircle className="size-5 animate-spin" />
              {t("loadingDetails")}
            </p>
          )}
          {detailError && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
            >
              {t(`errors.${detailError}`)}{" "}
              {selectedId && (
                <Button variant="outline" onClick={() => void openOrder(selectedId)}>
                  {t("retry")}
                </Button>
              )}
            </div>
          )}
          {detail && !detailLoading && (
            <div className="space-y-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Info label={t("customer")} value={detail.shippingAddress.fullName} />
                <Info label={t("phone")} value={detail.shippingAddress.phone} />
                <Info label={t("date")} value={date(detail.createdAt)} />
                <Info label={t("region")} value={t(`regions.${detail.shippingRegion}`)} />
                <Info label={t("city")} value={detail.shippingAddress.city} />
                <Info
                  label={t("address")}
                  value={[
                    detail.shippingAddress.streetAddress,
                    detail.shippingAddress.area,
                    detail.shippingAddress.building,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Info
                  label={t("paymentMethod")}
                  value={t(detail.paymentMethod === "online" ? "online" : "cashOnDelivery")}
                />
                <Info
                  label={t("paymentStatus")}
                  value={t(`paymentStatuses.${detail.paymentStatus}`)}
                />
                <Info label={t("orderStatus")} value={statusLabel(detail.status)} />
              </div>
              {detail.customerNotes && <Info label={t("notes")} value={detail.customerNotes} />}
              <section>
                <h3 className="mb-3 font-semibold">{t("items")}</h3>
                <ul className="space-y-3">
                  {detail.items.map((item, index) => (
                    <li
                      key={`${item.variantId}-${index}`}
                      className="flex gap-4 rounded-xl border border-[#eee5e0] p-3 dark:border-[#3a3431]"
                    >
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eee5e0] dark:bg-[#3a3431]">
                        <ProductImage
                          src={item.imageUrl || null}
                          alt={item.name?.[language] || item.sku}
                          placeholder={t("imageUnavailable")}
                          sizes="64px"
                          compact
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold wrap-anywhere">
                          {item.name?.[language] || item.sku}
                        </p>
                        <p className="mt-1 text-[#817571] dark:text-[#aaa09b]">
                          <bdi>{item.size}</bdi> · {item.color?.[language] || ""} · {item.sku}
                        </p>
                        <p className="mt-1">
                          {t("quantity", { count: item.quantity })} ×{" "}
                          <bdi>{currency(item.unitPrice)}</bdi>
                        </p>
                        <p className="mt-1 font-semibold">
                          <bdi>{currency(item.totalPrice)}</bdi>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <div className="space-y-2 border-t border-[#eee5e0] pt-4 text-sm dark:border-[#3a3431]">
                <div className="flex justify-between">
                  <span>{t("subtotal")}</span>
                  <bdi>{currency(detail.subtotal)}</bdi>
                </div>
                <div className="flex justify-between">
                  <span>{t("shippingFee")}</span>
                  <bdi>{currency(detail.shippingFee)}</bdi>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t("total")}</span>
                  <bdi>{currency(detail.total)}</bdi>
                </div>
              </div>
              <div className="rounded-xl border border-[#eee5e0] p-4 dark:border-[#3a3431]">
                <label htmlFor="order-next-status" className="mb-2 block text-sm font-semibold">
                  {t("changeStatus")}
                </label>
                <div className="flex flex-wrap gap-3">
                  <select
                    id="order-next-status"
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as OrderStatus | "")}
                    disabled={saving || availableStatuses.length === 0}
                    className="min-h-11 min-w-44 flex-1 rounded-xl border border-[#eee5e0] bg-white px-3 dark:border-[#3a3431] dark:bg-[#211e1c]"
                  >
                    <option value="">{t("chooseStatus")}</option>
                    {availableStatuses.map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    disabled={!nextStatus || saving}
                    onClick={() => void saveStatus()}
                    className="min-h-11 bg-[#a97872] text-white dark:bg-[#d4a39b] dark:text-[#171717]"
                  >
                    {t(saving ? "saving" : "saveStatus")}
                  </Button>
                </div>
                {orderStatusTransitions[detail.status].length === 0 && (
                  <p className="mt-2 text-xs text-[#817571] dark:text-[#aaa09b]">
                    {t("terminalStatus")}
                  </p>
                )}
                {detail.status === "processing" && (
                  <p className="mt-2 text-xs text-[#817571] dark:text-[#aaa09b]">
                    {t("shippedNoCancel")}
                  </p>
                )}
                {detail.paymentStatus !== "unpaid" &&
                  orderStatusTransitions[detail.status].includes("cancelled") && (
                    <p className="mt-2 text-xs text-[#817571] dark:text-[#aaa09b]">
                      {t("paidNoCancel")}
                    </p>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#817571] dark:text-[#aaa09b]">{label}</p>
      <p className="mt-1 wrap-anywhere whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  t,
  currency,
  date,
  onOpen,
}: {
  order: AdminOrderSummary;
  t: ReturnType<typeof useTranslations<"AdminOrders">>;
  currency: (value: number) => string;
  date: (value: string) => string;
  onOpen: (id: string) => Promise<void>;
}) {
  return (
    <article className="rounded-xl border border-[#eee5e0] p-4 text-sm dark:border-[#3a3431]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">
          <bdi>{order.orderNumber}</bdi>
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}
        >
          {t(`statuses.${order.status}`)}
        </span>
      </div>
      <p className="mt-3">
        {order.shippingAddress.fullName} · <bdi>{order.shippingAddress.phone}</bdi>
      </p>
      <p className="mt-1 text-[#817571] dark:text-[#aaa09b]">{date(order.createdAt)}</p>
      <p className="mt-2 font-semibold">
        <bdi>{currency(order.total)}</bdi> · {t(`paymentStatuses.${order.paymentStatus}`)}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 min-h-11 w-full"
        onClick={() => void onOpen(order._id)}
      >
        <Eye className="size-4" aria-hidden="true" />
        {t("viewDetails")}
      </Button>
    </article>
  );
}
