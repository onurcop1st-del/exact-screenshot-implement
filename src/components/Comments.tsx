import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Row = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  profiles: { username: string; color: number } | null;
};

const bodySchema = z.string().trim().min(1, "Write something first").max(500, "Keep it under 500 characters");

export const commentsKey = (productId: string) => ["comments", productId];

export function useComments(productId: string, enabled = true) {
  return useQuery({
    queryKey: commentsKey(productId),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, parent_id, user_id, profiles(username, color)")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });
}

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function CommentsSheet({ productId, title, open, onOpenChange }: { productId: string; title: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data = [], isLoading } = useComments(productId, open);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const top = data.filter((c) => !c.parent_id);
  const replies = (id: string) => data.filter((c) => c.parent_id === id);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const parsed = bodySchema.safeParse(text);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("comments").insert({
      product_id: productId,
      user_id: session.user.id,
      parent_id: replyTo ? (replyTo.parent_id ?? replyTo.id) : null,
      body: parsed.data,
    });
    setBusy(false);
    if (error) return toast.error("Couldn't post your comment");
    setText("");
    setReplyTo(null);
    qc.invalidateQueries({ queryKey: commentsKey(productId) });
  }

  async function remove(c: Row) {
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (error) return toast.error("Couldn't delete");
    qc.invalidateQueries({ queryKey: commentsKey(productId) });
  }

  function Item({ c, nested }: { c: Row; nested?: boolean }) {
    return (
      <li className={`flex gap-2 ${nested ? "ml-10" : ""}`}>
        <UserAvatar name={c.profiles?.username} color={c.profiles?.color} className={nested ? "h-6 w-6 text-sm" : ""} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{c.profiles?.username ?? "user"}</span> · {ago(c.created_at)}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {session && (
              <button onClick={() => setReplyTo(c)} className="font-semibold">Reply</button>
            )}
            {session?.user.id === c.user_id && (
              <button onClick={() => remove(c)} aria-label="Delete comment"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex h-[75dvh] max-w-md flex-col gap-0 rounded-t-xl bg-popover p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="font-display text-2xl">{data.length} comments · {title}</SheetTitle>
        </SheetHeader>
        <ul className="flex-1 space-y-4 overflow-y-auto p-4">
          {isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
          {!isLoading && !top.length && <li className="text-center text-sm text-muted-foreground">No comments yet. Be the first.</li>}
          {top.map((c) => (
            <div key={c.id} className="space-y-3">
              <Item c={c} />
              {replies(c.id).map((r) => <Item key={r.id} c={r} nested />)}
            </div>
          ))}
        </ul>
        <div className="border-t p-3">
          {session ? (
            <form onSubmit={submit} className="space-y-2">
              {replyTo && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CornerDownRight className="h-3 w-3" /> Replying to {replyTo.profiles?.username}
                  <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="ml-auto"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <div className="flex gap-2">
                <Input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? "Write a reply…" : "Add a comment…"} className="h-11" />
                <Button disabled={busy} size="icon" className="h-11 w-11" aria-label="Post"><Send className="h-4 w-4" /></Button>
              </div>
            </form>
          ) : (
            <Button asChild variant="secondary" className="h-11 w-full">
              <Link to="/profile" onClick={() => onOpenChange(false)}>Sign in to comment</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
