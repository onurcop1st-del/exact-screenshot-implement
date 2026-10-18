import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "mix" | "dark" | "light";
export const THEME_MODES: ThemeMode[] = ["mix", "dark", "light"];
const KEY = "onur-theme";

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; ambient: string | null; setAmbient: (url: string | null) => void };
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("mix");
  const [ambient, setAmbient] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as ThemeMode | null;
    if (saved && THEME_MODES.includes(saved)) setModeState(saved);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("dark", "light", "mix");
    el.classList.add(mode);
    if (mode !== "light") el.classList.add("dark");
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(KEY, m);
  };

  return <ThemeContext.Provider value={{ mode, setMode, ambient, setAmbient }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme outside provider");
  return c;
}

/** In Mix mode the page glows with a blurred copy of the product being viewed. */
export function AmbientBackdrop() {
  const { mode, ambient } = useTheme();
  if (mode !== "mix" || !ambient) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        key={ambient}
        style={{ backgroundImage: `url("${ambient}")` }}
        className="absolute inset-0 scale-125 bg-cover bg-center opacity-70 blur-3xl transition-opacity duration-700 animate-in fade-in"
      />
      <div className="absolute inset-0 bg-overlay" />
    </div>
  );
}
