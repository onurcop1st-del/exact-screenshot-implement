import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useShopper, InitialAvatar } from '@/lib/shopper';
import { commentSchema } from '@/lib/shopper-rules';

export function useCommentCount(productId: string) {
  const { data = 0 } = useQuery({
    queryKey: ['comment-count', productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId);
      if (error) throw error;
      return count ?? 0;
    },
  });
  return data;
}

export function ProductComments({ productId, title, open, onClose }: { productId: string; title: string; open: boolean; onClose: () => void }) {
  const { user } = useShopper();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [reply, setReply] = useState<{ id: string; username: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { data = [], isLoading, isError } = useQuery({ queryKey: ['comments', productId], enabled: open, queryFn: async () => {
    const { data, error } = await supabase.from('comments').select('*, profiles(username,color)').eq('product_id', productId).order('created_at');
    if (error) throw error; return data;
  }});
  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['comments', productId] }),
      qc.invalidateQueries({ queryKey: ['comment-count', productId] }),
    ]);
  }
  async function send() {
    if (!user) return;
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setBusy(true);
    const { error } = await supabase.from('comments').insert({ product_id: productId, user_id: user.id, parent_id: reply?.id ?? null, body: parsed.data });
    setBusy(false);
    if (error) { toast.error('Could not post your comment. Please try again.'); return; }
    setBody(''); setReply(null); await refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) toast.error('Could not delete comment');
    else await refresh();
  }
  function renderComment(c: typeof data[number], depth = 0): React.ReactNode {
    return <div key={c.id} className={`space-y-3 ${depth ? 'ml-5 border-l pl-3' : ''}`}>
      <div className="flex gap-3">
        <InitialAvatar username={c.profiles?.username ?? 'Shopper'} color={c.profiles?.color ?? 0} />
        <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{c.profiles?.username ?? 'Shopper'}</div><p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
          <div className="mt-1 flex items-center gap-2"><time className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</time>
            {user && <Button size="sm" variant="ghost" onClick={() => setReply({ id: c.id, username: c.profiles?.username ?? 'Shopper' })}>Reply</Button>}
            {user?.id === c.user_id && <Button size="icon" variant="ghost" aria-label="Delete comment" onClick={() => remove(c.id)}><Trash2 /></Button>}
          </div>
        </div>
      </div>
      {depth < 12 && data.filter(r => r.parent_id === c.id).map(r => renderComment(r, depth + 1))}
    </div>;
  }
  return <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}><SheetContent side="bottom" className="mx-auto flex max-h-[85dvh] max-w-md flex-col bg-popover">
    <SheetHeader><SheetTitle className="text-3xl">Comments · {title}</SheetTitle></SheetHeader>
    <div className="min-h-24 flex-1 space-y-5 overflow-y-auto px-4 py-3">
      {isLoading ? <p>Loading comments…</p> : isError ? <p>Comments couldn’t load. Try reopening.</p> : data.length === 0 ? <p className="text-muted-foreground">No comments yet.</p> : data.filter(c => !c.parent_id).map(c => renderComment(c))}
    </div>
    <div className="border-t p-4">
      {user ? <form onSubmit={e => { e.preventDefault(); void send(); }} className="space-y-2">
        {reply && <div className="flex items-center justify-between text-sm text-primary">Replying to {reply.username}<Button size="icon" variant="ghost" aria-label="Cancel reply" onClick={() => setReply(null)}><X /></Button></div>}
        <div className="flex items-end gap-2"><Textarea aria-label="Comment" placeholder={reply ? 'Write a reply…' : 'Add a comment…'} maxLength={500} value={body} onChange={e => setBody(e.target.value)} className="min-h-16" /><Button type="submit" disabled={busy || !body.trim()} size="icon" aria-label="Post comment"><Send /></Button></div>
      </form> : <Button asChild className="w-full"><Link to="/profile" onClick={onClose}>Sign in to comment</Link></Button>}
    </div>
  </SheetContent></Sheet>;
}
