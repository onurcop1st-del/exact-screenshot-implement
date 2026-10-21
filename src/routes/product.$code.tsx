import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchProducts, naira, type Product } from "@/lib/shop";
import { useCart } from "@/lib/cart";
import { useAppearance } from "@/lib/appearance";
import { useShopper } from "@/lib/shopper";
import { ProductComments, useCommentCount } from "@/components/ProductComments";

export const Route = createFileRoute("/product/$code")({
  head: () => ({
    meta: [
      { title: "Product — ONUR" },
      { name: "description", content: "View this ONUR drop up close and order on WhatsApp." },
      { property: "og:title", content: "Product — ONUR" },
      { property: "og:description", content: "View this ONUR drop up close." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { code } = Route.useParams();
  const { data = [], isLoading, isError } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const feed = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const list = data;
  const start = Math.max(0, list.findIndex((p) => p.code.toLowerCase() === code.toLowerCase()));

  useEffect(() => {
    setReady(false);
    const el = feed.current;
    if (!el || !list.length) return;
    const jump = () => {
      el.scrollTo({ top: start * el.clientHeight, behavior: "auto" });
      setReady(true);
    };
    const t = requestAnimationFrame(jump);
    return () => cancelAnimationFrame(t);
  }, [start, list.length]);

  return (
    <div className="relative">
      <Link
        to="/"
        aria-label="Back to shop"
        className="absolute left-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur"
      >
        <ArrowLeft className="h-6 w-6" />
      </Link>
      {isLoading && <p className="p-6 text-center text-muted-foreground">Loading drops…</p>}
      {isError && <p className="p-6 text-center text-muted-foreground">Couldn’t load this drop.</p>}
      {!isLoading && !isError && list.length > 0 && start === 0 && !list.some((p) => p.code.toLowerCase() === code.toLowerCase()) && (
        <p className="p-6 text-center text-muted-foreground">That drop isn’t available — showing the latest instead.</p>
      )}
      <div
        ref={feed}
        className="product-feed"
        aria-label="Product feed"
        tabIndex={0}
        style={{ visibility: ready ? "visible" : "hidden" }}
      >
        {list.map((p, i) => (
          <FeedPost key={p.id} p={p} eager={Math.abs(i - start) <= 1} />
        ))}
      </div>
    </div>
  );
}

function FeedPost({ p, eager }: { p: Product; eager: boolean }) {
  const { add } = useCart();
  const { recordGet } = useShopper();
  const { setImage } = useAppearance();
  const post = useRef<HTMLElement>(null);
  const [comments, setComments] = useState(false);
  const commentCount = useCommentCount(p.id);
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
          <Button variant="secondary" className="h-12 gap-1.5" aria-label={`Comments on ${p.title}`} onClick={() => setComments(true)}>
            <MessageCircle />{commentCount > 0 && <span className="text-sm font-semibold">{commentCount}</span>}
          </Button>
        </div>
      </div>
      <ProductComments productId={p.id} title={p.title} open={comments} onClose={() => setComments(false)} />
    </article>
  );
}
