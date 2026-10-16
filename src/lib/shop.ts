import { supabase } from "@/integrations/supabase/client";
import tee from "@/assets/tee.jpg";
import hoodie from "@/assets/hoodie.jpg";
import beanie from "@/assets/beanie.jpg";
import chain from "@/assets/chain.jpg";

export const WHATSAPP_NUMBER = "2349064235533";
export const TIKTOK_URL = "https://www.tiktok.com/@onur12321";
export const CATEGORIES = [
  { id: "cloths", label: "Cloths" },
  { id: "caps", label: "Caps" },
  { id: "accessories", label: "Accessories" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];

export type Product = {
  id: string;
  code: string;
  category: Category;
  title: string;
  description: string;
  price: number;
  stock_count: number;
  image_path: string | null;
  created_at: string;
  image: string;
};

const fallback: Record<string, string> = { cloths: tee, caps: beanie, accessories: chain };
const byCode: Record<string, string> = { HOD001: hoodie, JOG001: hoodie };

export const naira = (n: number) => "₦" + Number(n).toLocaleString("en-NG");

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const paths = data.map((p) => p.image_path).filter(Boolean) as string[];
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from("products")
      .createSignedUrls(paths, 60 * 60 * 24);
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    });
  }
  return data.map((p) => ({
    ...p,
    category: p.category as Category,
    image:
      (p.image_path && urls[p.image_path]) || byCode[p.code] || fallback[p.category] || tee,
  }));
}

export function makeOrderCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = crypto.getRandomValues(new Uint32Array(6));
  arr.forEach((v) => (s += chars[v % chars.length]));
  return "ONR-" + s;
}

export const isOrderCode = (q: string) => /^ONR-[A-Z0-9]{6}$/i.test(q.trim());
