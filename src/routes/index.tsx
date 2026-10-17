import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Shirt, GraduationCap, Gem } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartItem } from "@/lib/cart";
import { CATEGORIES, fetchProducts, isOrderCode, naira, type Category, type Product } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ONUR — Streetwear Drops" },
      { name: "description", content: "Shop ONUR tees, hoodies, caps and accessories. Pick, GET, and order on WhatsApp." },
      { property: "og:title", content: "ONUR — Streetwear Drops" },
      { property: "og:description", content: "Shop ONUR streetwear and order on WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [tab, setTab] = useState<Category>("cloths");
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { replace } = useCart();
  const navigate = useNavigate();

  const term = q.trim().toLowerCase();
  const list = data.filter(
    (p) =>
      (term ? true : p.category === tab) &&
      (!term ||
        p.code.toLowerCase() === term ||
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)),
  );

  async function lookupOrder() {
    const { data: items, error } = await supabase.rpc("get_order", { _code: q.trim().toUpperCase() });
    if (error || !items) {
      toast.error("No order found for that code");
      return;
    }
    replace(items as unknown as CartItem[]);
    toast.success("Order loaded into GET");
    navigate({ to: "/get" });
  }

  return (
    <div>
      <div className="sticky top-14 z-30 space-y-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description or code (e.g. ONR-XXXXXX)"
            className="h-10 pl-9"
          />
        </div>
        {isOrderCode(q) && (
          <Button onClick={lookupOrder} className="h-10 w-full">
            Open order {q.trim().toUpperCase()}
          </Button>
        )}
        {!term && (
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c.id];
              return (
                <button
                  key={c.id}
                  onClick={() => setTab(c.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    tab === c.id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {isLoading && <p className="p-6 text-center text-muted-foreground">Loading drops…</p>}
      {!isLoading && list.length === 0 && (
        <p className="p-6 text-center text-muted-foreground">Nothing here yet.</p>
      )}
      <div className="grid grid-cols-2 gap-3 p-4">
        {list.map((p, i) => (
          <ProductCard key={p.id} p={p} eager={i < 2} />
        ))}
      </div>
    </div>
  );
}

const ICONS = { cloths: Shirt, caps: GraduationCap, accessories: Gem } as const;

function ProductCard({ p, eager }: { p: Product; eager: boolean }) {
  const { add } = useCart();
  const out = p.stock_count <= 0;
  return (
    <article className="overflow-hidden rounded-md border bg-card">
      <img
        src={p.image}
        alt={p.title}
        loading={eager ? "eager" : "lazy"}
        className="aspect-[3/4] w-full object-cover"
      />
      <div className="space-y-1 p-3">
        <div className="text-[10px] text-muted-foreground">{p.code}</div>
        <h2 className="text-xl leading-none">{p.title}</h2>
        <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
        <div className="font-display text-xl text-primary">{naira(p.price)}</div>
        <div className="text-[10px] text-muted-foreground">{out ? "Sold out" : `${p.stock_count} left`}</div>
        <Button
          disabled={out}
          onClick={() => {
            add({ id: p.id, code: p.code, title: p.title, price: Number(p.price) });
            toast.success(`${p.title} added to GET`);
          }}
          className="mt-1 h-9 w-full font-display text-lg tracking-widest"
        >
          GET
        </Button>
      </div>
    </article>
  );
}
