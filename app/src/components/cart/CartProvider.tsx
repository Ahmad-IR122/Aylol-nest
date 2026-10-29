"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartError, CartItem, CartResult } from "@/lib/cart/state";
import CartDrawer from "./CartDrawer";

export type ApiCartItem = CartItem & { id: string; lineTotal: number; available: boolean };
type ApiCart = { id: string | null; items: ApiCartItem[]; subtotal: number; itemCount: number };
type CartContextValue = {
  items: ApiCartItem[];
  count: number;
  subtotal: number;
  busy: boolean;
  loading: boolean;
  open: boolean;
  sessionOnly: boolean;
  error: CartError | null;
  adjusted: boolean;
  unauthenticated: boolean;
  addItem: (slug: string, variantId: string, quantity: number) => Promise<CartResult>;
  updateQuantity: (item: ApiCartItem, quantity: number) => Promise<CartResult>;
  removeItem: (item: ApiCartItem) => Promise<CartResult>;
  clearCart: () => Promise<CartResult>;
  refresh: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  restoreFocus: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const emptyCart: ApiCart = { id: null, items: [], subtotal: 0, itemCount: 0 };

function errorFor(status: number): CartError {
  if (status === 400) return "invalid";
  if (status === 404) return "unavailable";
  if (status === 409) return "stock";
  return "server";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ApiCart>(emptyCart);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<CartError | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const locked = useRef(false);
  const requestVersion = useRef(0);
  const opener = useRef<HTMLElement | null>(null);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (version !== requestVersion.current) return;
      if (response.status === 401) {
        setUnauthenticated(true);
        setCart(emptyCart);
        setError(null);
      } else if (!response.ok) {
        setError(errorFor(response.status));
      } else {
        const data: { cart: ApiCart } = await response.json();
        if (version !== requestVersion.current) return;
        setCart(data.cart);
        setUnauthenticated(false);
        setError(null);
      }
    } catch {
      if (version === requestVersion.current) setError("server");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function change(url: string, method: string, body?: unknown): Promise<CartResult> {
    if (locked.current) return { ok: false, error: "busy" };
    locked.current = true;
    const version = ++requestVersion.current;
    setBusy(true);
    setLoading(false);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (response.status === 401) {
        setUnauthenticated(true);
        setCart(emptyCart);
        setError("unavailable");
        return { ok: false, error: "unavailable" };
      }
      if (!response.ok) {
        const nextError = errorFor(response.status);
        setError(nextError);
        if (response.status === 409 || response.status === 404) {
          await refresh();
          setError(nextError);
        }
        return { ok: false, error: nextError };
      }
      const data: { cart: ApiCart } = await response.json();
      if (version === requestVersion.current) setCart(data.cart);
      return { ok: true };
    } catch {
      setError("server");
      return { ok: false, error: "server" };
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        count: cart.itemCount,
        subtotal: cart.subtotal,
        busy,
        loading,
        open,
        sessionOnly: false,
        error,
        adjusted: false,
        unauthenticated,
        addItem: (slug, variantId, quantity) =>
          change("/api/cart/items", "POST", { slug, variantId, quantity }),
        updateQuantity: (item, quantity) =>
          change(`/api/cart/items/${item.id}`, "PATCH", { quantity }),
        removeItem: (item) => change(`/api/cart/items/${item.id}`, "DELETE"),
        clearCart: () => change("/api/cart", "DELETE"),
        refresh,
        openCart: () => {
          if (document.activeElement instanceof HTMLElement)
            opener.current = document.activeElement;
          setOpen(true);
          void refresh();
        },
        closeCart: () => setOpen(false),
        restoreFocus: () =>
          opener.current?.isConnected
            ? opener.current.focus()
            : document.querySelector<HTMLElement>("[data-store-menu-trigger]")?.focus(),
      }}
    >
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
