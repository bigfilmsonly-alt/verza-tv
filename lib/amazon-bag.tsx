"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { AMAZON_PRODUCTS, amazonCartUrl, isCartable, type AmazonProduct } from "./amazon-sponsors";

/* ------------------------------------------------------------------ */
/*  The Verza bag                                                      */
/*                                                                      */
/*  Shoppers collect Amazon products WITHOUT leaving Verza TV, then     */
/*  hand the whole bag to Amazon in a single trip: every item lands in  */
/*  their real Amazon cart, tagged to verzatv-20, ready to check out.   */
/*                                                                      */
/*  This is separate from the Stripe merch cart in lib/cart.tsx on      */
/*  purpose. That one we charge for ourselves; this one always settles  */
/*  on Amazon, because Amazon gives affiliates no checkout API. Mixing  */
/*  them would put two different payment paths behind one button.       */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "verza-amazon-bag";

export interface AmazonBagItem {
  product: AmazonProduct;
  quantity: number;
}

interface AmazonBagContextValue {
  items: AmazonBagItem[];
  isOpen: boolean;
  addItem: (product: AmazonProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openBag: () => void;
  closeBag: () => void;
  itemCount: number;
  /** Has this product already been added? Drives the "Added" tile state. */
  has: (productId: string) => boolean;
  /** The one-shot Amazon cart handoff for everything in the bag. */
  cartUrl: string | null;
}

const AmazonBagContext = createContext<AmazonBagContextValue | null>(null);

/** What we persist: ids and quantities only. */
type StoredItem = { id: string; quantity: number };

/** Read the saved bag, resolving ids against the LIVE catalog. */
function readBag(): AmazonBagItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored: StoredItem[] = JSON.parse(raw);
    // Resolve against AMAZON_PRODUCTS rather than trusting persisted product
    // data, so a product we retire cannot come back from a stale bag sitting
    // in someone's browser.
    return stored
      .map(({ id, quantity }) => {
        const product = AMAZON_PRODUCTS.find((p) => p.id === id);
        return product ? { product, quantity: Math.max(1, quantity) } : null;
      })
      .filter((i): i is AmazonBagItem => i !== null);
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — start empty.
    return [];
  }
}

function writeBag(items: AmazonBagItem[]) {
  try {
    const stored: StoredItem[] = items.map((i) => ({ id: i.product.id, quantity: i.quantity }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage full or blocked — the bag still works for this session.
  }
}

export function AmazonBagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AmazonBagItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Mirrors `items` so the mutators can read the current bag without taking it
  // as a dependency (which would rebuild every callback on every change).
  const itemsRef = useRef<AmazonBagItem[]>([]);

  // Rehydrate on mount. Not during render: localStorage does not exist on the
  // server, and a client-only initial value would break hydration.
  useEffect(() => {
    const restored = readBag();
    if (restored.length > 0) {
      itemsRef.current = restored;
      queueMicrotask(() => setItems(restored));
    }
  }, []);

  /**
   * The single write path: state and localStorage move together.
   *
   * Persisting here rather than in an effect on [items] is deliberate. An
   * effect would also fire on the very first render, writing the empty initial
   * bag over the saved one before the rehydrate above had a chance to land.
   */
  const commit = useCallback((next: AmazonBagItem[]) => {
    itemsRef.current = next;
    setItems(next);
    writeBag(next);
  }, []);

  const addItem = useCallback(
    (product: AmazonProduct) => {
      // A search link has no single ASIN, so Amazon has nothing to cart.
      if (!isCartable(product)) return;
      const prev = itemsRef.current;
      const existing = prev.find((i) => i.product.id === product.id);
      commit(
        existing
          ? prev.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...prev, { product, quantity: 1 }],
      );
      setIsOpen(true);
    },
    [commit],
  );

  const removeItem = useCallback(
    (productId: string) => {
      commit(itemsRef.current.filter((i) => i.product.id !== productId));
    },
    [commit],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        commit(itemsRef.current.filter((i) => i.product.id !== productId));
        return;
      }
      commit(
        itemsRef.current.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i,
        ),
      );
    },
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const has = useCallback(
    (productId: string) => items.some((i) => i.product.id === productId),
    [items],
  );

  const cartUrl = useMemo(() => {
    const cartable = items
      .filter((i) => i.product.asin)
      .map((i) => ({ asin: i.product.asin as string, quantity: i.quantity }));
    return cartable.length > 0 ? amazonCartUrl(cartable) : null;
  }, [items]);

  return (
    <AmazonBagContext.Provider
      value={{
        items,
        isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        openBag: () => setIsOpen(true),
        closeBag: () => setIsOpen(false),
        itemCount,
        has,
        cartUrl,
      }}
    >
      {children}
    </AmazonBagContext.Provider>
  );
}

export function useAmazonBag() {
  const ctx = useContext(AmazonBagContext);
  if (!ctx) throw new Error("useAmazonBag must be used within AmazonBagProvider");
  return ctx;
}
