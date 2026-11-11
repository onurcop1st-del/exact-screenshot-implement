import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATEGORIES, fetchProducts, naira, WHATSAPP_NUMBER } from "@/lib/shop";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$code")({
  head: () => ({
    meta: [
      { title: "Product — ONUR" },
      { name: "description", content: "Product details, price and how to order from ONUR on WhatsApp." },
      { property: "og:title", content: "Product — ONUR" },
      { property: "og:description", content: "Product details, price and how to order from ONUR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { code } = Route.useParams();
  const { add } = useCart();
  const { data = [], isLoading, isError } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const p = data.find((x) => x.code.toLowerCase() === code.toLowerCase());
  const related = p ? data.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-3 bg-muted/40 pb-24">
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card px-3 py-2">
        <Link to="/" aria-label="Back to shop" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="font-semibold">Product details</span>
      </div>

      {isLoading && <p className="p-6 text-center text-muted-foreground">Loading…</p>}
      {isError && <p className="p-6 text-center text-muted-foreground">Couldn’t load this product.</p>}
      {!isLoading && !isError && !p && <p className="p-6 text-center text-muted-foreground">This product isn’t available.</p>}

      {p && (
        <>
          <section className="bg-card">
            <img src={p.image} alt={p.title} className="aspect-square w-full bg-muted object-contain" />
            <div className="space-y-2 p-4">
              <div className="text-xs text-muted-foreground">
                {CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category} · Code {p.code}
              </div>
              <h1 className="font-sans text-xl font-semibold leading-snug normal-case">{p.title}</h1>
              <div className="text-3xl font-bold">{naira(p.price)}</div>
              <div className={`text-sm font-medium ${p.stock_count > 0 ? "text-primary" : "text-destructive"}`}>
                {p.stock_count > 0 ? `In stock · ${p.stock_count} left` : "Sold out"}
              </div>
              <Button
                disabled={p.stock_count <= 0}
                className="h-12 w-full text-lg font-bold"
                onClick={() => {
                  add({ id: p.id, code: p.code, title: p.title, price: Number(p.price) });
                  toast.success(`${p.title} added to GET`);
                }}
              >
                <ShoppingBag /> GET
              </Button>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-2 bg-card p-3 text-center text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1"><Truck className="h-5 w-5 text-primary" />Delivery nationwide</div>
            <div className="flex flex-col items-center gap-1"><ShieldCheck className="h-5 w-5 text-primary" />Quality checked</div>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1"><MessageCircle className="h-5 w-5 text-primary" />Ask on WhatsApp</a>
          </section>

          <section className="space-y-2 bg-card p-4">
            <h2 className="border-b pb-2 font-sans text-base font-semibold normal-case">Product details</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{p.description || "No description yet."}</p>
          </section>

          <section className="space-y-2 bg-card p-4">
            <h2 className="border-b pb-2 font-sans text-base font-semibold normal-case">Specifications</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Product code</dt><dd>{p.code}</dd>
              <dt className="text-muted-foreground">Category</dt><dd>{CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category}</dd>
              <dt className="text-muted-foreground">Brand</dt><dd>ONUR</dd>
              <dt className="text-muted-foreground">Added</dt><dd>{new Date(p.created_at).toLocaleDateString()}</dd>
            </dl>
          </section>

          {related.length > 0 && (
            <section className="space-y-2 bg-card p-4">
              <h2 className="font-sans text-base font-semibold normal-case">You may also like</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {related.map((r) => (
                  <Link key={r.id} to="/product/$code" params={{ code: r.code }} className="space-y-1 rounded-md border p-2">
                    <img src={r.image} alt={r.title} loading="lazy" className="aspect-square w-full rounded-sm bg-muted object-cover" />
                    <div className="line-clamp-1 text-xs">{r.title}</div>
                    <div className="text-sm font-bold">{naira(r.price)}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="px-4 text-[10px] leading-snug text-muted-foreground">
            How to order: 1. Tap GET to add items. 2. Open GET in the bottom bar and copy your ONR order code.
            3. Send the code on WhatsApp to confirm size, delivery address and payment.
          </p>
        </>
      )}
    </div>
  );
}
