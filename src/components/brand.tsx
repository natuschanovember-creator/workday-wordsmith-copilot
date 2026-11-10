import logoMark from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoMark}
      alt=""
      aria-hidden="true"
      width={280}
      height={280}
      className={cn("size-8 shrink-0 object-contain", className)}
    />
  );
}

export function BrandBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-card shadow-soft ring-1 ring-border",
        className,
      )}
    >
      <LogoMark className="size-6" />
    </span>
  );
}

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col leading-tight">
      <span
        className={cn(
          "font-display text-sm font-semibold tracking-tight",
          inverted ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        AI Workplace
      </span>
      <span
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.14em]",
          inverted ? "text-sidebar-primary" : "text-muted-foreground",
        )}
      >
        Productivity Assistant
      </span>
    </span>
  );
}
