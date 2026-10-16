import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
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
    <div className="flex h-[calc(100dvh-3.5rem-3.5rem)] flex-col">
      <div className="space-y-3 border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description or code (e.g. ONR-XXXXXX)"
            className="h-11 pl-9"
          />
        </div>
        {isOrderCode(q) && (
          <Button onClick={lookupOrder} className="h-11 w-full">
            Open order {q.trim().toUpperCase()}
          </Button>
        )}
        {!term && (
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setTab(c.id)}
                className={`flex-1 rounded-sm border py-2 font-display text-xl tracking-wider ${
                  tab === c.id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="feed-snap flex-1">
        {isLoading && <p className="p-6 text-center text-muted-foreground">Loading drops…</p>}
        {!isLoading && list.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">Nothing here yet.</p>
        )}
        {list.map((p, i) => (
          <FeedItem key={p.id} p={p} eager={i === 0} />
        ))}
      </div>
    </div>
  );
}

function FeedItem({ p, eager }: { p: Product; eager: boolean }) {
  const { add } = useCart();
  const out = p.stock_count <= 0;
  return (
    <article className="snap-item relative h-full w-full overflow-hidden">
      <img
        src={p.image}
        alt={p.title}
        loading={eager ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="fade-bottom absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
        <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{p.code}</span>
        <h2 className="text-5xl leading-none">{p.title}</h2>
        <p className="text-sm text-muted-foreground">{p.description}</p>
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="font-display text-3xl text-primary">{naira(p.price)}</div>
            <div className="text-xs text-muted-foreground">
              {out ? "Sold out" : `${p.stock_count} left`}
            </div>
          </div>
          <Button
            disabled={out}
            onClick={() => {
              add({ id: p.id, code: p.code, title: p.title, price: Number(p.price) });
              toast.success(`${p.title} added to GET`);
            }}
            className="h-14 px-10 font-display text-3xl tracking-widest"
          >
            GET
          </Button>
        </div>
      </div>
    </article>
  );
}
