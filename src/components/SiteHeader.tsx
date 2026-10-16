import { Link } from "@tanstack/react-router";
import { MoreVertical, ShoppingBag, Store, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/shop";

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.4a2.9 2.9 0 1 1-2-2.7V9.2a6.3 6.3 0 1 0 5.4 6.2V8.6a8.2 8.2 0 0 0 3.8 1.2V6.7z" />
    </svg>
  );
}
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur">
      <Link to="/" className="flex items-baseline gap-2">
        <span className="font-display text-3xl tracking-widest">ONUR</span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-primary">Stitched for the streets</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link to="/get" aria-label="Open GET list" className="relative p-2">
          <ShoppingBag className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <button aria-label="Menu" className="p-2">
              <MoreVertical className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto bg-popover">
            <SheetHeader>
              <SheetTitle className="font-display text-4xl">About ONUR</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6 text-sm leading-relaxed text-muted-foreground">
              <div className="flex gap-3">
                <a href={TIKTOK_URL} target="_blank" rel="noreferrer" aria-label="TikTok"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                  <TikTokIcon className="h-6 w-6" />
                </a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp text-primary-foreground">
                  <WhatsAppIcon className="h-6 w-6" />
                </a>
              </div>
              <p className="text-base text-foreground">
                ONUR is a brand name where you can get the outfit of your choice — and many more.
              </p>
              <div>
                <h3 className="text-2xl text-foreground">Our story</h3>
                <p>
                  Founded in 2024, ONUR started as a small sewing table and a big idea: clothes should
                  fit who you are, not just your size. Every piece begins as a sketch, gets cut by hand
                  and is stitched with care before it reaches you.
                </p>
              </div>
              <div>
                <h3 className="text-2xl text-foreground">Where we're based</h3>
                <p>
                  We're based in Nigeria and proudly made locally. We ship across the country and
                  love seeing our pieces worn on every street.
                </p>
              </div>
              <div>
                <h3 className="text-2xl text-foreground">The craft</h3>
                <p>
                  Heavyweight cotton, double-stitched seams, clean finishing and fabrics picked for
                  Nigerian weather. From oversized tees and hoodies to joggers, caps and accessories,
                  we focus on comfort, durability and a fit that looks right.
                </p>
              </div>
              <div>
                <h3 className="text-2xl text-foreground">Custom orders</h3>
                <p>
                  Want your own colour, size or design? Send us a message on WhatsApp — we sew
                  custom pieces and limited drops made just for you.
                </p>
              </div>
              <div>
                <h3 className="text-2xl text-foreground">How to order</h3>
                <p>
                  Tap GET on the items you love, open your GET list, generate your order code and
                  send it to us on WhatsApp. That's it.
                </p>
              </div>
              <p className="text-xs">© {new Date().getFullYear()} ONUR. All rights reserved.</p>
              <SheetClose asChild>
                <Link to="/admin" className="flex items-center gap-1 text-xs opacity-50">
                  <Lock className="h-3 w-3" /> Admin
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { count } = useCart();
  const cls = "flex flex-1 items-center justify-center gap-2 py-3 font-display text-xl tracking-wider";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md border-t bg-background/95 backdrop-blur">
      <Link to="/" className={cls} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
        <Store className="h-5 w-5" /> Shop
      </Link>
      <Link to="/get" className={cls} activeProps={{ className: "text-primary" }}>
        <ShoppingBag className="h-5 w-5" /> GET {count > 0 && `(${count})`}
      </Link>
    </nav>
  );
}
