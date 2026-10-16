import { Link } from "@tanstack/react-router";
import { MoreVertical, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/shop";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur">
      <Link to="/" className="font-display text-3xl tracking-widest">
        ONUR
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
          <SheetContent className="bg-popover">
            <SheetHeader>
              <SheetTitle className="font-display text-4xl">About ONUR</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 px-4">
              <p className="text-muted-foreground">
                ONUR is a custom streetwear label made for the culture — heavy fabrics, clean cuts,
                small drops. Pick what you like, hit GET, and send your order straight to us on
                WhatsApp.
              </p>
              <div className="space-y-3">
                <Button asChild className="h-12 w-full text-base">
                  <a href={TIKTOK_URL} target="_blank" rel="noreferrer">
                    Follow on TikTok
                  </a>
                </Button>
                <Button asChild variant="secondary" className="h-12 w-full text-base">
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { count } = useCart();
  const cls = "flex flex-1 flex-col items-center py-3 font-display text-xl tracking-wider";
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md z-40 flex border-t bg-background/95 backdrop-blur">
      <Link to="/" className={cls} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
        Shop
      </Link>
      <Link to="/get" className={cls} activeProps={{ className: "text-primary" }}>
        GET {count > 0 && `(${count})`}
      </Link>
      <Link to="/admin" className={`${cls} text-muted-foreground`} activeProps={{ className: "text-primary" }}>
        Admin
      </Link>
    </nav>
  );
}
