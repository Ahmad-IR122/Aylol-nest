import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import ProductImage from "@/components/home/ProductImage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { orderStatusTransitions, type OrderStatus } from "@/lib/orders/status";
import type { AdminOrder } from "@/types/admin-order";

import OrderInfo from "./OrderInfo";
import type { OrderErrorCode } from "./order-utils";

type Translator = ReturnType<typeof useTranslations<"AdminOrders">>;

export default function OrderDetailsDialog({
  open,
  detail,
  detailLoading,
  detailError,
  selectedId,
  saving,
  nextStatus,
  availableStatuses,
  language,
  t,
  currency,
  date,
  onClose,
  onOpen,
  onNextStatusChange,
  onSaveStatus,
}: {
  open: boolean;
  detail: AdminOrder | null;
  detailLoading: boolean;
  detailError: OrderErrorCode | null;
  selectedId: string | null;
  saving: boolean;
  nextStatus: OrderStatus | "";
  availableStatuses: OrderStatus[];
  language: "ar" | "en";
  t: Translator;
  currency: (value: number) => string;
  date: (value: string) => string;
  onClose: () => void;
  onOpen: (id: string) => Promise<void>;
  onNextStatusChange: (value: OrderStatus | "") => void;
  onSaveStatus: () => void;
}) {
  const statusLabel = (value: OrderStatus) => t(`statuses.${value}`);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        dir={language === "ar" ? "rtl" : "ltr"}
        className="max-h-[90dvh] w-full max-w-[calc(100%-2rem)] overflow-y-auto border-[#eee5e0] bg-white p-5 text-[#352d2b] sm:max-w-3xl sm:p-7 dark:border-[#3a3431] dark:bg-[#292524] dark:text-[#f5efec]"
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
              <Button variant="outline" onClick={() => void onOpen(selectedId)}>
                {t("retry")}
              </Button>
            )}
          </div>
        )}
        {detail && !detailLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <OrderInfo label={t("customer")} value={detail.shippingAddress.fullName} />
              <OrderInfo label={t("phone")} value={detail.shippingAddress.phone} />
              <OrderInfo label={t("date")} value={date(detail.createdAt)} />
              <OrderInfo label={t("region")} value={t(`regions.${detail.shippingRegion}`)} />
              <OrderInfo label={t("city")} value={detail.shippingAddress.city} />
              <OrderInfo
                label={t("address")}
                value={[
                  detail.shippingAddress.streetAddress,
                  detail.shippingAddress.area,
                  detail.shippingAddress.building,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <OrderInfo
                label={t("paymentMethod")}
                value={t(detail.paymentMethod === "online" ? "online" : "cashOnDelivery")}
              />
              <OrderInfo
                label={t("paymentStatus")}
                value={t(`paymentStatuses.${detail.paymentStatus}`)}
              />
              <OrderInfo label={t("orderStatus")} value={statusLabel(detail.status)} />
            </div>
            {detail.customerNotes && <OrderInfo label={t("notes")} value={detail.customerNotes} />}
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
                  onChange={(event) => onNextStatusChange(event.target.value as OrderStatus | "")}
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
                  onClick={onSaveStatus}
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
  );
}
