"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { refreshCart, validateCartItem } from "@/lib/cart/actions";
import {
  CART_STORAGE_KEY,
  MAX_CART_LINES,
  cartKey,
  cartReferenceSchema,
  cartReferences,
  parseStoredCart,
  requestedCartQuantity,
  type CartError,
  type CartItem,
  type CartReference,
  type CartResult,
} from "@/lib/cart/state";
import CartDrawer from "./CartDrawer";

type CartContextValue = {
  items: CartItem[];
  count: number;
  busy: boolean;
  open: boolean;
  sessionOnly: boolean;
  error: CartError | null;
  adjusted: boolean;
  addItem: (slug: string, variantId: string, quantity: number) => Promise<CartResult>;
  updateQuantity: (item: CartItem, quantity: number) => Promise<CartResult>;
  removeItem: (item: CartItem) => void;
  openCart: () => void;
  closeCart: () => void;
  restoreFocus: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function callAction<T>(action: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    startTransition(async () => {
      try {
        resolve(await action());
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(false);
  const [sessionOnly, setSessionOnly] = useState(false);
  const [error, setError] = useState<CartError | null>(null);
  const [adjusted, setAdjusted] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  const referencesRef = useRef<CartReference[]>([]);
  const locked = useRef(true);
  const opener = useRef<HTMLElement | null>(null);

  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    referencesRef.current = cartReferences(next);
    setItems(next);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(referencesRef.current));
      setSessionOnly(false);
    } catch {
      // The cart still works for this tab. Explain the persistence limit in UI.
      setSessionOnly(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      let storageUnavailable = false;
      let references: CartReference[] = [];
      try {
        references = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
      } catch {
        storageUnavailable = true;
      }
      referencesRef.current = references;
      try {
        const result = references.length
          ? await callAction(() => refreshCart(references))
          : await Promise.resolve({ ok: true as const, items: [], adjusted: false });
        if (cancelled) return;
        if (result.ok) {
          commit(result.items);
          setAdjusted(result.adjusted);
        } else {
          setError(result.error);
        }
      } catch {
        if (!cancelled) setError("server");
      } finally {
        if (!cancelled) {
          if (storageUnavailable) setSessionOnly(true);
          locked.current = false;
          setBusy(false);
        }
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [commit]);

  async function changeItem(reference: CartReference, append: boolean): Promise<CartResult> {
    if (locked.current) return { ok: false, error: "busy" };
    const parsed = cartReferenceSchema.safeParse(reference);
    if (!parsed.success) return { ok: false, error: "invalid" };
    // Preserve un-restored references after a network failure; retry in the
    // drawer before changing the cart so persisted items are never overwritten.
    if (referencesRef.current.length && !itemsRef.current.length) {
      return { ok: false, error: "server" };
    }
    const existing = itemsRef.current.find((item) => cartKey(item) === cartKey(reference));
    if (!existing && itemsRef.current.length >= MAX_CART_LINES) {
      return { ok: false, error: "full" };
    }
    const quantity = append
      ? requestedCartQuantity(itemsRef.current, parsed.data)
      : parsed.data.quantity;
    if (!Number.isSafeInteger(quantity)) return { ok: false, error: "invalid" };
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await callAction(() => validateCartItem({ ...parsed.data, quantity }));
      if (!result.ok) {
        setError(result.error);
        return result;
      }
      const next = existing
        ? itemsRef.current.map((item) =>
            cartKey(item) === cartKey(result.item) ? result.item : item,
          )
        : [...itemsRef.current, result.item];
      commit(next);
      return { ok: true };
    } catch {
      setError("server");
      return { ok: false, error: "server" };
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function recheck() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await callAction(() => refreshCart(referencesRef.current));
      if (result.ok) {
        commit(result.items);
        setAdjusted(result.adjusted);
      } else setError(result.error);
    } catch {
      setError("server");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.reduce((total, item) => total + item.quantity, 0),
        busy,
        open,
        sessionOnly,
        error,
        adjusted,
        addItem: (slug, variantId, quantity) => changeItem({ slug, variantId, quantity }, true),
        updateQuantity: (item, quantity) =>
          changeItem({ slug: item.slug, variantId: item.variantId, quantity }, false),
        removeItem: (item) => {
          if (locked.current) return;
          commit(itemsRef.current.filter((candidate) => cartKey(candidate) !== cartKey(item)));
          setError(null);
        },
        openCart: () => {
          if (!open && document.activeElement instanceof HTMLElement) {
            opener.current = document.activeElement;
          }
          setOpen(true);
          void recheck();
        },
        closeCart: () => setOpen(false),
        restoreFocus: () => {
          const target = opener.current?.isConnected
            ? opener.current
            : document.querySelector<HTMLElement>("[data-store-menu-trigger]");
          target?.focus();
        },
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
