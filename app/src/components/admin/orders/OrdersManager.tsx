"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { orderStatusTransitions, type OrderStatus } from "@/lib/orders/status";
import type { AdminOrder, AdminOrderList } from "@/types/admin-order";

import OrderDetailsDialog from "./OrderDetailsDialog";
import OrdersFilters from "./OrdersFilters";
import OrdersResults from "./OrdersResults";
import { errorCode, orderRequest, type OrderErrorCode } from "./order-utils";

export default function OrdersManager({
  initialStatus = "",
  initialOrderId,
}: {
  initialStatus?: OrderStatus | "";
  initialOrderId?: string;
}) {
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const t = useTranslations("AdminOrders");
  const format = useFormatter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">(initialStatus);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState<AdminOrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<OrderErrorCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<OrderErrorCode | null>(null);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), limit: "12" });
    if (search) query.set("search", search);
    if (status) query.set("status", status);
    const timer = window.setTimeout(() => {
      setLoading(true);
      setListError(null);
      orderRequest<AdminOrderList>(`/api/admin/orders?${query}`, { signal: controller.signal })
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
  }, [page, revision, search, status]);

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

  useEffect(() => {
    if (!initialOrderId) return;
    const timer = window.setTimeout(() => void openOrder(initialOrderId), 0);
    return () => window.clearTimeout(timer);
  }, [initialOrderId]);

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
      if (errorCode(error) === "server" || errorCode(error) === "network")
        void openOrder(detail._id);
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  const availableStatuses = detail
    ? orderStatusTransitions[detail.status].filter(
        (value) => value !== "cancelled" || detail.paymentStatus === "unpaid",
      )
    : [];
  const filtered = Boolean(search || status);

  return (
    <main className="min-w-0 p-5 md:p-8" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#817571] dark:text-[#aaa09b]">{t("description")}</p>
        </header>
        {notice && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {notice}
          </p>
        )}
        <OrdersFilters
          searchInput={searchInput}
          status={status}
          t={t}
          onSearchChange={setSearchInput}
          onStatusChange={(value) => {
            setStatus(value as OrderStatus | "");
            setPage(1);
          }}
        />
        <OrdersResults
          list={list}
          loading={loading}
          error={listError}
          filtered={filtered}
          page={page}
          t={t}
          currency={currency}
          date={date}
          onOpen={openOrder}
          onRetry={() => setRevision((value) => value + 1)}
          onPageChange={setPage}
        />
      </div>
      <OrderDetailsDialog
        open={selectedId !== null}
        detail={detail}
        detailLoading={detailLoading}
        detailError={detailError}
        selectedId={selectedId}
        saving={saving}
        nextStatus={nextStatus}
        availableStatuses={availableStatuses}
        language={language}
        t={t}
        currency={currency}
        date={date}
        onClose={close}
        onOpen={openOrder}
        onNextStatusChange={setNextStatus}
        onSaveStatus={() => void saveStatus()}
      />
    </main>
  );
}
