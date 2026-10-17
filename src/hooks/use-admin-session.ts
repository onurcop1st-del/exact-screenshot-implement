import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useAdminSession() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [ending, setEnding] = useState(false);
  const [expired, setExpired] = useState(false);
  const current = useRef<Session | null>(null);
  const closing = useRef(false);

  async function endSession(reason: "signout" | "expired") {
    if (closing.current) return;
    closing.current = true;
    setEnding(true);
    current.current = null;
    setSession(null);
    setExpired(reason === "expired");
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut({ scope: reason === "signout" ? "global" : "local" });
      if (error) {
        await supabase.auth.signOut({ scope: "local" });
        toast.error("Signed out on this device. Other sessions could not be ended; please try again when connected.");
      }
    } finally {
      setEnding(false);
      closing.current = false;
    }
  }
  const endRef = useRef(endSession);
  endRef.current = endSession;

  useEffect(() => {
    let active = true;
    function accept(next: Session | null) {
      if (!active || closing.current) return;
      const lostSession = Boolean(current.current) && !next;
      current.current = next;
      setSession(next);
      setReady(true);
      if (next) setExpired(false);
      if (lostSession) {
        setExpired(true);
        void queryClient.cancelQueries().then(() => queryClient.clear());
      }
    }
    const { data } = supabase.auth.onAuthStateChange((_event, next) => accept(next));
    async function restore() {
      const { data: stored, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !stored.session) return accept(null);
      const { error: invalidUser } = await supabase.auth.getUser();
      if (!active) return;
      if (invalidUser) {
        await endRef.current("expired");
        setReady(true);
      } else accept(stored.session);
    }
    void restore();
    async function checkOnReturn() {
      if (document.visibilityState === "hidden" || !current.current || closing.current) return;
      const { error } = await supabase.auth.getUser();
      if (active && error) await endRef.current("expired");
    }
    window.addEventListener("focus", checkOnReturn);
    document.addEventListener("visibilitychange", checkOnReturn);
    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.removeEventListener("focus", checkOnReturn);
      document.removeEventListener("visibilitychange", checkOnReturn);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!session?.expires_at) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      if (closing.current) return;
      const { data, error } = await supabase.auth.refreshSession();
      if (!active) return;
      if (error || !data.session || (data.session.expires_at ?? 0) * 1000 <= Date.now()) {
        await endRef.current("expired");
      } else {
        current.current = data.session;
        setSession(data.session);
      }
    }, Math.min(Math.max(0, session.expires_at * 1000 - Date.now()), 2_147_483_647));
    return () => { active = false; window.clearTimeout(timer); };
  }, [session]);

  return { session, ready, ending, expired, signOut: () => endSession("signout") };
}