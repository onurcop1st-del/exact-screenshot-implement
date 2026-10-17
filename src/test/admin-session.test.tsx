import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useAdminSession } from "@/hooks/use-admin-session";

const auth = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const session = { user: { id: "owner" }, expires_at: Math.floor(Date.now() / 1000) + 3600 } as Session;
let emit: (event: string, next: Session | null) => void;
function setup() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(() => useAdminSession(), { wrapper }), client };
}
beforeEach(() => {
  vi.clearAllMocks();
  auth.getSession.mockResolvedValue({ data: { session }, error: null });
  auth.getUser.mockResolvedValue({ data: { user: session.user }, error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.onAuthStateChange.mockImplementation((cb) => { emit = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
});
afterEach(() => vi.useRealTimers());

describe("Admin session security", () => {
  it("ends Auth sessions globally and removes cached admin data", async () => {
    const { result, client } = setup();
    await waitFor(() => expect(result.current.session?.user.id).toBe("owner"));
    client.setQueryData(["private-admin-data"], ["secret"]);
    await act(() => result.current.signOut());
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(client.getQueryData(["private-admin-data"])).toBeUndefined();
    expect(result.current.session).toBeNull();
    expect(result.current.expired).toBe(false);
  });
  it("returns to login when Auth reports a lost session", async () => {
    const { result, client } = setup();
    await waitFor(() => expect(result.current.ready).toBe(true));
    client.setQueryData(["private-admin-data"], ["secret"]);
    await act(async () => emit("SIGNED_OUT", null));
    expect(result.current.session).toBeNull();
    expect(result.current.expired).toBe(true);
    expect(client.getQueryData(["private-admin-data"])).toBeUndefined();
  });
  it("clears the session when its expired token cannot be refreshed", async () => {
    auth.getSession.mockResolvedValue({ data: { session: { ...session, expires_at: Math.floor(Date.now() / 1000) + 2 } }, error: null });
    auth.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error("refresh expired") });
    const { result } = setup();
    await waitFor(() => expect(result.current.ready).toBe(true));
    vi.useFakeTimers();
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    // The effect scheduled its timer before fake timers were installed; emit the
    // expired token again to exercise the refresh timer under fake time.
    await act(async () => emit("TOKEN_REFRESHED", { ...session, expires_at: Math.floor(Date.now() / 1000) }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(auth.refreshSession).toHaveBeenCalled();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(result.current.expired).toBe(true);
    expect(result.current.session).toBeNull();
  });
});