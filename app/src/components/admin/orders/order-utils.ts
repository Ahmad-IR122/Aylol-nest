import type { OrderStatus } from "@/lib/orders/status";

export type OrderErrorCode =
  "unauthorized" | "forbidden" | "notFound" | "conflict" | "invalid" | "network" | "server";

export class OrderRequestError extends Error {
  constructor(public code: OrderErrorCode) {
    super(code);
  }
}

export async function orderRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url, { cache: "no-store", ...options, signal: controller.signal });
    if (!response.ok) {
      const code: OrderErrorCode =
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
    throw new OrderRequestError("network");
  } finally {
    window.clearTimeout(timeout);
    options?.signal?.removeEventListener("abort", onAbort);
  }
}

export function errorCode(error: unknown): OrderErrorCode {
  return error instanceof OrderRequestError ? error.code : "server";
}

export function statusClass(status: OrderStatus) {
  if (status === "delivered")
    return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (status === "cancelled")
    return "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  return "bg-[#f8eeeb] text-[#704c47] dark:bg-[#3b2d2b] dark:text-[#e2ada4]";
}
