import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, fetchProducts, naira, type Category, type Product } from "@/lib/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — ONUR" },
      { name: "description", content: "ONUR inventory management." },
      { property: "og:title", content: "Admin — ONUR" },
      { property: "og:description", content: "ONUR inventory management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(false);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return null;
  if (!session) return <Login />;
  if (!isAdmin)
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">This account is not an admin.</p>
        <Button className="mt-4" variant="secondary" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  return <Dashboard />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 p-6">
      <h1 className="text-5xl">Admin login</h1>
      <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
      <Input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
      <Button disabled={busy} className="h-12 w-full">{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

const empty = { title: "", description: "", price: "", stock_count: "", category: "cloths" as Category };

function Dashboard() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  function startEdit(p: Product) {
    setEditing(p);
    setForm({ title: p.title, description: p.description, price: String(p.price), stock_count: String(p.stock_count), category: p.category });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let image_path = editing?.image_path ?? null;
      if (file) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
        const { error } = await supabase.storage.from("products").upload(path, file);
        if (error) throw error;
        image_path = path;
      }
      const row = {
        title: form.title,
        description: form.description,
        price: Number(form.price) || 0,
        stock_count: Number(form.stock_count) || 0,
        category: form.category,
        image_path,
      };
      const { error } = editing
        ? await supabase.from("products").update(row).eq("id", editing.id)
        : await supabase.from("products").insert(row);
      if (error) throw error;
      toast.success(editing ? "Product updated" : "Product added");
      setForm(empty);
      setFile(null);
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  }

  async function setStock(p: Product, n: number) {
    await supabase.from("products").update({ stock_count: Math.max(0, n) }).eq("id", p.id);
    refresh();
  }

  async function del(p: Product) {
    if (!confirm(`Delete ${p.title}?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    if (p.image_path) await supabase.storage.from("products").remove([p.image_path]);
    refresh();
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-5xl">Inventory</h1>
        <Button variant="secondary" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>

      <form onSubmit={save} className="space-y-3 rounded-md border bg-card p-4">
        <h2 className="text-3xl">{editing ? `Edit ${editing.code}` : "Upload product"}</h2>
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} onClick={() => setForm({ ...form, category: c.id })}
              className={`flex-1 rounded-sm border py-2 text-sm ${form.category === c.id ? "border-primary bg-primary text-primary-foreground" : ""}`}>
              {c.label}
            </button>
          ))}
        </div>
        <Input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex gap-2">
          <Input required type="number" min="0" placeholder="Price (₦)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input required type="number" min="0" placeholder="Stock" value={form.stock_count} onChange={(e) => setForm({ ...form, stock_count: e.target.value })} />
        </div>
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2">
          <Button disabled={busy} className="flex-1">{busy ? "Saving…" : editing ? "Save changes" : "Upload"}</Button>
          {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button>}
        </div>
      </form>

      <ul className="space-y-2">
        {data.map((p) => (
          <li key={p.id} className="flex gap-3 rounded-md border bg-card p-3">
            <img src={p.image} alt={p.title} loading="lazy" className="h-20 w-16 rounded-sm object-cover" />
            <div className="flex-1 space-y-1">
              <div className="font-semibold">{p.title} <span className="text-xs text-muted-foreground">{p.code}</span></div>
              <div className="text-xs text-muted-foreground">
                {p.category} · {naira(p.price)} · {new Date(p.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setStock(p, p.stock_count - 1)}>-</Button>
                <span className="text-sm">{p.stock_count} left</span>
                <Button size="sm" variant="secondary" onClick={() => setStock(p, p.stock_count + 1)}>+</Button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => del(p)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
