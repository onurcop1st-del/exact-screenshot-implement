import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { id: string; username: string; color: number };
type Ctx = { session: Session | null; ready: boolean; profile: Profile | null; refreshProfile: () => void };
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") qc.removeQueries({ queryKey: ["me"] });
    });
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  const uid = session?.user.id;
  const { data: profile = null } = useQuery({
    queryKey: ["me", "profile", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, username, color").eq("id", uid!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  return (
    <AuthContext.Provider
      value={{ session, ready, profile: uid ? profile : null, refreshProfile: () => qc.invalidateQueries({ queryKey: ["me", "profile"] }) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
