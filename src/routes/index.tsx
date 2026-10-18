import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Search, Shirt, GraduationCap, Gem, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommentsSheet, useComments } from "@/components/Comments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart, type CartItem } from "@/lib/cart";
import { recordGet } from "@/lib/gets";
import { useTheme } from "@/lib/theme";
import { CATEGORIES, fetchProducts, isOrderCode, naira, type Category, type Product } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ONUR — Streetwear Drops" },
      { name: "description", content: "Swipe through ONUR tees, hoodies, caps and accessories. Comment, GET, and order on WhatsApp." },
      { property: "og:title", content: "ONUR — Streetwear Drops" },
      { property: "og:description", content: "Swipe ONUR streetwear and order on WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const ICONS = { cloths: Shirt, caps: GraduationCap, accessories: Gem } as const;

function Home() {
  const [tab, setTab] = useState<Category>("cloths");
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { replace } = useCart();
  const navigate = useNavigate();
  const { setAmbient } = useTheme();
  const feed = useRef<HTMLDivElement>(null);

  const term = q.trim().toLowerCase();
  const list = data.filter(
    (p) =>
      (term ? true : p.category === tab) &&
      (!term || p.code.toLowerCase() === term || p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)),
  );

  useEffect(() => {
    feed.current?.scrollTo({ top: 0 });
    if (list[0]) setAmbient(list[0].image);
  }, [tab, term, list[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function lookupOrder() {
    const { data: items, error } = await supabase.rpc("get_order", { _code: q.trim().toUpperCase() });
    if (error || !items) return toast.error("No order found for that code");
    replace(items as unknown as CartItem[]);
    toast.success("Order loaded into GET");
    navigate({ to: "/get" });
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 z-20 space-y-2 bg-gradient-to-b from-overlay to-transparent px-3 pb-6 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or paste code (ONR-XXXXXX)" className="h-9 border-0 bg-background/60 pl-9 backdrop-blur" />
        </div>
        {isOrderCode(q) && (
          <Button onClick={lookupOrder} className="h-9 w-full">Open order {q.trim().toUpperCase()}</Button>
        )}
        {!term && (
          <div className="flex justify-center gap-2">
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c.id];
              return (
                <button key={c.id} onClick={() => setTab(c.id)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ${tab === c.id ? "bg-primary text-primary-foreground" : "bg-background/50 text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" /> {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div ref={feed} className="feed-snap h-[calc(100dvh-7rem)]">
        {isLoading && <p className="p-24 text-center text-muted-foreground">Loading drops…</p>}
        {!isLoading && list.length === 0 && <p className="p-24 text-center text-muted-foreground">Nothing here yet.</p>}
        {list.map((p, i) => <FeedItem key={p.id} p={p} eager={i < 2} root={feed} />)}
      </div>
    </div>
  );
}

function FeedItem({ p, eager, root }: { p: Product; eager: boolean; root: React.RefObject<HTMLDivElement | null> }) {
  const { add } = useCart();
  const { session } = useAuth();
  const { setAmbient } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(eager);
  const { data: comments = [] } = useComments(p.id, seen);
  const out = p.stock_count <= 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAmbient(p.image); setSeen(true); }
    }, { root: root.current, threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [p.image, root, setAmbient]);

  function get() {
    add({ id: p.id, code: p.code, title: p.title, price: Number(p.price) });
    if (session) void recordGet(session.user.id, p.id);
    toast.success(`${p.title} added to GET`);
  }

  return (
    <article ref={ref} className="snap-item relative h-full overflow-hidden">
      <img src={p.image} alt={p.title} loading={eager ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
      <div className="fade-bottom absolute inset-0" />
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 text-foreground">
        <button onClick={() => setOpen(true)} aria-label="Comments" className="flex flex-col items-center gap-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/50 backdrop-blur"><MessageCircle className="h-6 w-6" /></span>
          <span className="text-xs font-semibold">{comments.length}</span>
        </button>
        <button onClick={get} disabled={out} aria-label="GET" className="flex flex-col items-center gap-1 disabled:opacity-40">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><ShoppingBag className="h-5 w-5" /></span>
          <span className="text-xs font-semibold">GET</span>
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 pr-20 text-foreground">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.code} · {out ? "Sold out" : `${p.stock_count} left`}</div>
        <h2 className="text-4xl leading-none">{p.title}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        <div className="font-display text-3xl text-primary">{naira(p.price)}</div>
      </div>
      <CommentsSheet productId={p.id} title={p.title} open={open} onOpenChange={setOpen} />
    </article>
  );
}
