import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { naira, type Product } from "@/lib/shop";
import { recommendProducts, type Recommendation } from "@/lib/recommend.functions";

export function StyleHelper({ products }: { products: Product[] }) {
  const ask = useServerFn(recommendProducts);
  const [need, setNeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [picks, setPicks] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (need.trim().length < 3 || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await ask({ data: { need, catalog: products.map((p) => ({ code: p.code, title: p.title, category: p.category, price: Number(p.price), description: p.description ?? null })) } });
      setPicks(res.picks); setError(res.error);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  const byCode = new Map(products.map((p) => [p.code, p]));
  return (
    <section className="mx-2 mt-2 rounded-md bg-card p-3">
      <h2 className="flex items-center gap-1.5 font-sans text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" />Tell us what you need</h2>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <Input value={need} onChange={(e) => setNeed(e.target.value)} maxLength={400} placeholder="e.g. a warm outfit for a night out" aria-label="Describe what you need" />
        <Button type="submit" disabled={busy || need.trim().length < 3}>{busy ? "Finding…" : "Find"}</Button>
      </form>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {picks && !error && picks.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No close match — try describing it another way.</p>}
      {picks && picks.length > 0 && (
        <ul className="mt-3 space-y-2">
          {picks.map((r) => { const p = byCode.get(r.code); if (!p) return null; return (
            <li key={r.code}>
              <Link to="/product/$code" params={{ code: p.code }} className="flex gap-3 rounded-md bg-muted p-2">
                <img src={p.image} alt={p.title} className="h-16 w-16 rounded object-cover" />
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.title}</span><span className="block text-sm font-bold">{naira(p.price)}</span><span className="block text-xs text-muted-foreground">{r.reason}</span></span>
              </Link>
            </li>); })}
        </ul>
      )}
    </section>
  );
}
