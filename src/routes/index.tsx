import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Shirt, GraduationCap, Gem, ShoppingBag, LayoutGrid, Truck, ShieldCheck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartItem } from "@/lib/cart";
import { CATEGORIES, fetchProducts, isOrderCode, naira, type Category, type Product } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ONUR — Shop Streetwear Online in Nigeria" },
      { name: "description", content: "Shop ONUR tees, hoodies, caps and accessories in Naira. Tap GET and order on WhatsApp." },
      { property: "og:title", content: "ONUR — Shop Streetwear Online" },
      { property: "og:description", content: "Shop ONUR streetwear in Naira and order on WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const ICONS = { cloths: Shirt, caps: GraduationCap, accessories: Gem } as const;

function Home() {
  const [tab, setTab] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const { data = [], isLoading, isError, refetch } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { replace } = useCart();
  const navigate = useNavigate();

  const term = q.trim().toLowerCase();
  const list = data.filter(
    (p) =>
      (term || tab === "all" ? true : p.category === tab) &&
      (!term || p.code.toLowerCase() === term || p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)),
  );

  async function lookupOrder() {
    const { data: items, error } = await supabase.rpc("get_order", { _code: q.trim().toUpperCase() });
    if (error || !items) return toast.error("No order found for that code");
    replace(items as unknown as CartItem[]);
    toast.success("Order loaded into GET");
    navigate({ to: "/get" });
  }

  return (
    <div className="pb-4">
      <div className="sticky top-14 z-30 bg-header px-3 pb-2 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search products or order code" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands and categories" className="h-10 rounded-full bg-muted pl-9" />
        </div>
        {isOrderCode(q) && <Button onClick={lookupOrder} className="mt-2 h-10 w-full">Open order {q.trim().toUpperCase()}</Button>}
      </div>

      <div className="mx-2 mt-2 flex items-center justify-between rounded-md bg-promo px-4 py-3 text-promo-foreground">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">New drops</p>
          <p className="text-lg font-bold leading-tight">Outfits of your choice</p>
          <p className="text-xs opacity-80">Order easily on WhatsApp</p>
        </div>
        <ShoppingBag className="h-10 w-10 text-primary" />
      </div>

      <div className="mx-2 mt-2 grid grid-cols-3 gap-2 text-center text-[11px] font-medium">
        <span className="flex flex-col items-center gap-1 rounded-md bg-card p-2"><Truck className="h-4 w-4 text-primary" />Nationwide delivery</span>
        <span className="flex flex-col items-center gap-1 rounded-md bg-card p-2"><ShieldCheck className="h-4 w-4 text-primary" />Hand-stitched</span>
        <span className="flex flex-col items-center gap-1 rounded-md bg-card p-2"><MessageCircle className="h-4 w-4 text-primary" />WhatsApp orders</span>
      </div>

      {!term && (
        <div className="mx-2 mt-2 flex gap-2 overflow-x-auto rounded-md bg-card p-2">
          {[{ id: "all" as const, label: "All" }, ...CATEGORIES].map((c) => {
            const Icon = c.id === "all" ? LayoutGrid : ICONS[c.id];
            const on = tab === c.id;
            return (
              <button key={c.id} onClick={() => setTab(c.id)} aria-pressed={on}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium ${on ? "bg-accent text-primary" : "text-foreground"}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${on ? "bg-primary text-primary-foreground" : "bg-muted"}`}><Icon className="h-5 w-5" /></span>
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mx-2 mt-2 flex items-center justify-between rounded-t-md bg-primary px-3 py-2 text-primary-foreground">
        <h2 className="font-sans text-base font-bold">{term ? `Results for “${q.trim()}”` : "Top deals"}</h2>
        <span className="text-xs">{list.length} items</span>
      </div>
      <div className="mx-2 rounded-b-md bg-muted">
        {isLoading && <p className="p-6 text-center text-muted-foreground">Loading products…</p>}
        {isError && <div className="p-6 text-center"><p>Couldn’t load products.</p><Button onClick={() => refetch()} className="mt-3">Try again</Button></div>}
        {!isLoading && !isError && list.length === 0 && <p className="p-6 text-center text-muted-foreground">No products found.</p>}
        <div className="product-grid" aria-label="Products">
          {list.map((p, i) => <ProductCard key={p.id} p={p} eager={i < 4} />)}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ p, eager }: { p: Product; eager: boolean }) {
  const { add } = useCart();
  const out = p.stock_count <= 0;
  const low = Math.min(100, Math.max(8, p.stock_count * 5));
  return (
    <article className="product-card" aria-label={p.title}>
      <Link to="/product/$code" params={{ code: p.code }} aria-label={`View ${p.title}`} className="block bg-card">
        <img src={p.image} alt={p.title} loading={eager ? "eager" : "lazy"} className="aspect-square w-full object-cover" />
      </Link>
      <div className="space-y-1 p-2">
        <Link to="/product/$code" params={{ code: p.code }} className="block">
          <h3 className="line-clamp-2 min-h-8 font-sans text-xs leading-4">{p.title}</h3>
        </Link>
        <div className="text-base font-bold">{naira(p.price)}</div>
        <div className="text-[10px] text-muted-foreground">{out ? "Sold out" : `${p.stock_count} items left`} · {p.code}</div>
        {!out && <div className="h-1 overflow-hidden rounded-full bg-deal"><div className="h-full bg-primary" style={{ width: `${low}%` }} /></div>}
        <Button disabled={out} size="sm" className="mt-1 h-8 w-full text-xs font-bold uppercase"
          onClick={() => { add({ id: p.id, code: p.code, title: p.title, price: Number(p.price) }); toast.success(`${p.title} added to GET`); }}>
          <ShoppingBag /> GET
        </Button>
      </div>
    </article>
  );
}
