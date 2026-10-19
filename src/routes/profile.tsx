import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, type FormEvent } from 'react';
import { LogOut, Moon, Sun, Blend, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useShopper, InitialAvatar } from '@/lib/shopper';
import { useAppearance, type Appearance } from '@/lib/appearance';
import { AVATAR_COLORS, usernameSchema, colorSchema } from '@/lib/shopper-rules';
import { useCart } from '@/lib/cart';
import { naira } from '@/lib/shop';

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [ { title: 'Your profile — ONUR' }, { name: 'description', content: 'Your ONUR profile, colours, and personal GET history.' }, { property: 'og:title', content: 'Your profile — ONUR' }, { property: 'og:description', content: 'Your ONUR profile and personal picks.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' } ] }),
  component: Profile,
});

function AppearanceControls() {
  const { mode, setMode } = useAppearance();
  const options: { id: Appearance; icon: typeof Moon; label: string }[] = [{ id: 'mix', icon: Blend, label: 'Mix' }, { id: 'dark', icon: Moon, label: 'Dark' }, { id: 'light', icon: Sun, label: 'Light' }];
  return <section className="space-y-3 border-b py-5"><h2 className="text-2xl">Appearance</h2><div className="flex gap-2">{options.map(o => <Button key={o.id} variant={mode === o.id ? 'default' : 'secondary'} aria-pressed={mode === o.id} onClick={() => setMode(o.id)} className="flex-1"><o.icon />{o.label}</Button>)}</div></section>;
}
function Profile() {
  const { user, profile, ready, signOut, refresh, recordGet } = useShopper();
  const { items } = useCart();
  const [username, setUsername] = useState('');
  const [color, setColor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [historyTab, setHistoryTab] = useState<'getting' | 'got'>('getting');
  useEffect(() => { if (profile) { setUsername(profile.username); setColor(profile.color); } }, [profile]);
  const { data: history = [], isError } = useQuery({ queryKey: ['get-history', user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from('user_gets').select('*, products(title,price,code)').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error; return data;
  }});
  async function save(e: FormEvent) {
    e.preventDefault(); if (!user) return;
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success || !colorSchema.safeParse(color).success) { toast.error(parsed.error?.issues[0]?.message ?? 'Choose a colour'); return; }
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ username: parsed.data, color }).eq('id', user.id);
    setBusy(false); if (error) toast.error('That username may be taken. Please try another.'); else { await refresh(); toast.success('Profile saved'); }
  }
  return <div className="px-5 pb-6"><h1 className="pt-5 text-5xl">Your profile</h1><AppearanceControls />
    {!ready ? <p className="py-5">Checking account…</p> : !user ? <AccountForm /> : <>
      <form onSubmit={save} className="space-y-4 border-b py-6">
        <div className="flex items-center gap-4"><InitialAvatar username={username} color={color} large /><div className="min-w-0 flex-1"><label htmlFor="username" className="text-sm text-muted-foreground">Username</label><Input id="username" value={username} onChange={e => setUsername(e.target.value)} required maxLength={24} /><p className="mt-2 truncate text-xs text-muted-foreground">{user.email}</p></div></div>
        <h2 className="text-2xl">Your colour</h2><div className="grid grid-cols-10 gap-2">{AVATAR_COLORS.map(c => <Button key={c} type="button" size="icon" variant="ghost" aria-label={`Avatar colour ${c + 1}`} aria-pressed={color === c} onClick={() => setColor(c)} data-color={c} className="avatar-color aspect-square h-auto w-full rounded-full p-0">{color === c && <Check />}</Button>)}</div>
        <Button disabled={busy} type="submit" className="w-full">{busy ? 'Saving…' : 'Save profile'}</Button>
      </form>
      <section className="space-y-4 py-5"><h2 className="text-3xl">My picks</h2><div className="flex gap-2"><Button variant={historyTab === 'getting' ? 'default' : 'secondary'} onClick={() => setHistoryTab('getting')}>About to GET</Button><Button variant={historyTab === 'got' ? 'default' : 'secondary'} onClick={() => setHistoryTab('got')}>GET history</Button></div>
        {isError && <p>History couldn’t load. Please try again.</p>}
        {history.filter(h => h.status === historyTab).map(h => <div key={h.id} className="flex items-center justify-between gap-3 border-b py-3"><div className="min-w-0"><h3 className="text-xl">{h.products?.title ?? 'Unavailable product'}</h3><p className="text-sm text-muted-foreground">{naira(h.products?.price ?? 0)}</p></div>{h.status === 'getting' && <Button size="sm" variant="secondary" onClick={() => recordGet(h.product_id, 'got').catch(() => toast.error('Could not update history'))}>Got it</Button>}</div>)}
        {!history.some(h => h.status === historyTab) && <p className="text-sm text-muted-foreground">No saved picks here yet.</p>}
        {historyTab === 'getting' && items.filter(i => !history.some(h => h.product_id === i.id && h.status === 'getting')).map(i => <div key={i.id} className="flex items-center justify-between border-b py-3"><h3 className="text-xl">{i.title}</h3><Button size="sm" variant="secondary" onClick={() => recordGet(i.id).catch(() => toast.error('Could not save pick'))}>Save pick</Button></div>)}
        <Button asChild variant="outline" className="w-full"><Link to="/get">Open GET list</Link></Button>
      </section><Button variant="ghost" onClick={() => signOut().catch(() => toast.error('Could not sign out. Please try again.'))} className="w-full"><LogOut />Sign out</Button>
    </>}
  </div>;
}
function AccountForm() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (signup && !usernameSchema.safeParse(username).success) { toast.error('Use 2–24 letters, numbers, dots or underscores'); return; }
    setBusy(true);
    try {
      const { data, error } = signup ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: username.trim(), color: 0 }, emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (signup && !data.session) toast.success('Check your email to finish creating your account');
      else toast.success(signup ? 'Welcome to ONUR' : 'Signed in');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not sign in'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4 py-6"><div className="flex gap-2"><Button type="button" variant={!signup ? 'default' : 'secondary'} onClick={() => setSignup(false)}>Sign in</Button><Button type="button" variant={signup ? 'default' : 'secondary'} onClick={() => setSignup(true)}>Create account</Button></div>
    {signup && <div><label htmlFor="new-username">Username</label><Input id="new-username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required maxLength={24} /></div>}
    <div><label htmlFor="account-email">Email</label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
    <div><label htmlFor="account-password">Password</label><Input id="account-password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} required /></div>
    <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : signup ? 'Join ONUR' : 'Sign in to ONUR'}</Button>
  </form>;
}