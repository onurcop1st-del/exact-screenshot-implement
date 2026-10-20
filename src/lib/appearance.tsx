import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_APPEARANCE } from './shopper-rules';

export type Appearance = 'dark' | 'light' | 'mix';
const Context = createContext<{ mode: Appearance; setMode: (m: Appearance) => void; setImage: (s: string) => void } | null>(null);
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [image, setImage] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('onur-appearance');
    if (stored === 'dark' || stored === 'light' || stored === 'mix') setMode(stored);
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.dataset['appearance'] = mode;
    if (ready) localStorage.setItem('onur-appearance', mode);
  }, [mode, ready]);
  return <Context.Provider value={{ mode, setMode, setImage }}>
    <div className="ambient-background" aria-hidden="true">{mode === 'mix' && image && <img src={image} alt="" />}</div>
    {children}
  </Context.Provider>;
}
export function useAppearance() { const c = useContext(Context); if (!c) throw new Error('Appearance provider required'); return c; }