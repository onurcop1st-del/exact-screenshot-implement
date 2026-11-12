import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { WHATSAPP_NUMBER, fetchProducts, makeOrderCode, naira } from "@/lib/shop";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/get")({
  head: () => ({
    meta: [
      { title: "Your GET list — ONUR" },
      { name: "description", content: "Review your ONUR picks, get your order code and send it on WhatsApp." },
      { property: "og:title", content: "Your GET list — ONUR" },
      { property: "og:description", content: "Review picks and order ONUR on WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GetPage,
});

function GetPage() {
  const { items, total, setQty, remove, orderCode, setOrderCode } = useCart();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  async function generate() {
    setBusy(true);
    for (let i = 0; i < 3; i++) {
      const code = makeOrderCode();
      const { error } = await supabase.from("orders").insert({ order_code: code, items_json: items });
      if (!error) {
        setOrderCode(code);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    toast.error("Couldn't create a code, try again");
  }

  const message = orderCode
    ? `Hi ONUR! I want to order:\n${items
        .map((i) => `• ${i.title} (${i.code}) x${i.qty} — ${naira(i.price * i.qty)}`)
        .join("\n")}\nTotal: ${naira(total)}\nOrder code: ${orderCode}`
    : "";

  if (!items.length)
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <h1 className="text-5xl">Nothing here yet</h1>
        <p className="text-muted-foreground">Tap GET on anything you like.</p>
        <Button asChild className="h-12 px-8">
          <Link to="/">Browse the drop</Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-5xl">Your GET</h1>
      <ul className="divide-y rounded-md border bg-card">
        {items.map((i) => (
          <li key={i.id} className="p-3">
           <div className="flex items-center gap-3">
            {(() => { const pr = products.find((x) => x.id === i.id); return pr ? <img src={pr.image} alt={i.title} className="h-12 w-12 shrink-0 rounded-sm bg-muted object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-sm bg-muted" />; })()}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{i.title}</div>
              <div className="text-xs text-muted-foreground">
                {i.code} · {naira(i.price)}
              </div>
              <button type="button" onClick={() => setOpen(open === i.id ? null : i.id)} aria-expanded={open === i.id}
                className="text-xs font-semibold text-primary">{open === i.id ? "See less" : "View"}</button>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="secondary" aria-label="Less" onClick={() => setQty(i.id, i.qty - 1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center">{i.qty}</span>
              <Button size="icon" variant="secondary" aria-label="More" onClick={() => setQty(i.id, i.qty + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(i.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
           </div>
            {open === i.id && (() => { const pr = products.find((x) => x.id === i.id); return (
              <div className="mt-3 space-y-2">
                {pr && <img src={pr.image} alt={i.title} className="max-h-80 w-full rounded-sm bg-muted object-contain" />}
                <p className="whitespace-pre-line text-sm">{pr?.description || "No description yet."}</p>
                <button type="button" onClick={() => setOpen(null)} className="text-xs font-semibold text-primary">See less</button>
              </div>
            ); })()}
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-display text-3xl">
        <span>Total</span>
        <span className="text-primary">{naira(total)}</span>
      </div>

      {!orderCode ? (
        <Button onClick={generate} disabled={busy} className="h-14 w-full font-display text-2xl tracking-widest">
          {busy ? "Generating…" : "GET CODE"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-primary p-4">
            <span className="font-display text-4xl tracking-widest">{orderCode}</span>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(orderCode);
                toast.success("Code copied");
              }}
            >
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <Button asChild className="h-14 w-full bg-whatsapp text-lg text-primary-foreground hover:bg-whatsapp/90">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
            >
              Send order on WhatsApp
            </a>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Paste this code in the shop search anytime to bring this order back.
          </p>
        </div>
      )}
    </div>
  );
}
