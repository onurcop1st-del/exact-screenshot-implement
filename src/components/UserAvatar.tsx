import { avatarColor, initialOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, color, className }: { name?: string | null; color?: number | null; className?: string }) {
  return (
    <span
      aria-hidden
      // Background is data-driven: each user picks one of 100 avatar colours.
      style={{ backgroundColor: avatarColor(color ?? 0) }}
      className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-lg text-primary-foreground", className)}
    >
      {initialOf(name)}
    </span>
  );
}
