import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; code: string; title: string; price: number; qty: number };

type Ctx = {
  items: CartItem[];
  count: number;
  total: number;
  orderCode: string | null;
  add: (i: Omit<CartItem, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  replace: (items: CartItem[]) => void;
  setOrderCode: (c: string | null) => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "onur-get";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setItems(p.items ?? []);
        setOrderCode(p.orderCode ?? null);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ items, orderCode }));
  }, [items, orderCode, loaded]);

  const change = (fn: (p: CartItem[]) => CartItem[]) => {
    setItems(fn);
    setOrderCode(null);
  };

  const value: Ctx = {
    items,
    orderCode,
    setOrderCode,
    count: items.reduce((s, i) => s + i.qty, 0),
    total: items.reduce((s, i) => s + i.qty * i.price, 0),
    add: (i) =>
      change((p) =>
        p.some((x) => x.id === i.id)
          ? p.map((x) => (x.id === i.id ? { ...x, qty: x.qty + 1 } : x))
          : [...p, { ...i, qty: 1 }],
      ),
    setQty: (id, qty) =>
      change((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))),
    remove: (id) => change((p) => p.filter((x) => x.id !== id)),
    replace: (next) => change(() => next),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
