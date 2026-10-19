import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { initial } from './shopper-rules';

type ContextValue = { user: User | null; ready: boolean; profile: Tables<'profiles'> | null; signOut: () => Promise<void>; refresh: () => Promise<void>; recordGet: (id: string, status?: 'getting' | 'got') => Promise<void> };
const Context = createContext<ContextValue | null>(null);
export function ShopperProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null); setReady(true);
      if (!session) { void qc.cancelQueries().then(() => qc.removeQueries({ predicate: q => ['profile','get-history'].includes(String(q.queryKey[0])) })); }
    });
    void supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setReady(true); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [qc]);
  const { data: profile = null } = useQuery({ queryKey: ['profile', user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error; return data;
  }});
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ['profile'] }); };
  async function signOut() { setUser(null); await qc.cancelQueries(); qc.clear(); const { error } = await supabase.auth.signOut(); if (error) throw error; }
  async function recordGet(id: string, status: 'getting' | 'got' = 'getting') {
    if (!user) return;
    const { error } = await supabase.from('user_gets').upsert({ user_id: user.id, product_id: id, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,product_id' });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['get-history', user.id] });
  }
  return <Context.Provider value={{ user, ready, profile: user ? profile : null, signOut, refresh, recordGet }}>{children}</Context.Provider>;
}
export function useShopper() { const c = useContext(Context); if (!c) throw new Error('Shopper provider required'); return c; }
export function InitialAvatar({ username, color, large = false }: { username: string; color: number; large?: boolean }) {
  return <span data-color={color} className={`avatar-color inline-flex shrink-0 items-center justify-center rounded-full font-sans font-semibold ${large ? 'h-20 w-20 text-4xl' : 'h-8 w-8 text-sm'}`}>{initial(username)}</span>;
}