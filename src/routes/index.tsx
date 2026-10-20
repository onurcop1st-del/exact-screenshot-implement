import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Search, Shirt, GraduationCap, Gem, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartItem } from "@/lib/cart";
import { CATEGORIES, fetchProducts, isOrderCode, naira, type Category, type Product } from "@/lib/shop";
import { useAppearance } from "@/lib/appearance";
import { useShopper } from "@/lib/shopper";
import { ProductComments } from "@/components/ProductComments";

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
  const { data = [], isLoading, isError, refetch } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { replace } = useCart();
  const navigate = useNavigate();
  const feed = useRef<HTMLDivElement>(null);
  useEffect(() => { feed.current?.scrollTo({ top: 0 }); }, [tab, q]);

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
            aria-label="Search products or order code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search drops or order code"
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
                <Button
                  key={c.id}
                  onClick={() => setTab(c.id)}
                  variant={tab === c.id ? "default" : "ghost"}
                  aria-pressed={tab === c.id}
                  size="sm" className="h-7 rounded-full px-3 text-xs uppercase"
                >
                  <Icon className="h-3.5 w-3.5" /> {c.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
      {isLoading && <p className="p-6 text-center text-muted-foreground">Loading drops…</p>}
      {isError && <div className="p-6 text-center"><p>Couldn’t load the drops.</p><Button onClick={() => refetch()} className="mt-3">Try again</Button></div>}
      {!isLoading && !isError && list.length === 0 && (
        <p className="p-6 text-center text-muted-foreground">Nothing here yet.</p>
      )}
      <div ref={feed} className="product-feed" aria-label="Product feed" tabIndex={0}>
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
  const { recordGet } = useShopper();
  const { setImage } = useAppearance();
  const post = useRef<HTMLElement>(null);
  const [comments, setComments] = useState(false);
  useEffect(() => {
    if (!post.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting && e.intersectionRatio > 0.6)) setImage(p.image);
    }, { threshold: [0.6, 0.8] });
    observer.observe(post.current);
    return () => observer.disconnect();
  }, [p.image, setImage]);
  const out = p.stock_count <= 0;
  return (
    <article ref={post} className="product-post" aria-label={p.title}>
      <img
        src={p.image}
        alt={p.title}
        loading={eager ? "eager" : "lazy"}
        className="w-full object-cover"
      />
      <div className="product-caption space-y-2">
        <div className="text-xs text-feed-ink/70">{p.code} · {out ? "Sold out" : `${p.stock_count} left`}</div>
        <h2 className="text-4xl leading-none">{p.title}</h2>
        <p className="line-clamp-2 text-sm text-feed-ink/80">{p.description}</p>
        <div className="font-display text-3xl text-feed-ink">{naira(p.price)}</div>
        <div className="flex gap-3 pt-1">
        <Button
          disabled={out}
          onClick={() => {
            add({ id: p.id, code: p.code, title: p.title, price: Number(p.price) });
            void recordGet(p.id).catch(() => toast.error('Added to GET, but history could not be saved.'));
            toast.success(`${p.title} added to GET`);
          }}
          className="h-12 flex-1 font-display text-2xl"
        >
          <ShoppingBag /> GET
        </Button>
        <Button variant="secondary" className="h-12" aria-label={`Comments on ${p.title}`} onClick={() => setComments(true)}><MessageCircle /></Button>
        </div>
      </div>
      <ProductComments productId={p.id} title={p.title} open={comments} onClose={() => setComments(false)} />
    </article>
  );
}
