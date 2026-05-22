import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  hint?: string;
  emphasize?: boolean;
}

export function StatCard({ label, value, unit, delta, hint, emphasize }: StatCardProps) {
  const dir = delta == null ? null : delta < -0.05 ? "down" : delta > 0.05 ? "up" : "flat";
  const Icon = dir === "down" ? ArrowDown : dir === "up" ? ArrowUp : Minus;
  const deltaColor =
    dir === "down" ? "text-success" : dir === "up" ? "text-warning" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-card p-4 transition-all duration-300 hover:shadow-sm sm:p-5",
        emphasize && "bg-foreground text-background border-foreground",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-medium uppercase tracking-wider sm:text-xs",
          emphasize ? "text-background/60" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1.5 num sm:mt-3">
        <span className="text-2xl font-semibold sm:text-3xl">{value}</span>
        {unit && (
          <span className={cn("text-xs font-medium sm:text-sm", emphasize ? "text-background/60" : "text-muted-foreground")}>
            {unit}
          </span>
        )}
      </div>
      {delta != null && (
        <div className={cn("mt-2 flex items-center gap-1 text-xs num", deltaColor)}>
          <Icon className="h-3 w-3" />
          <span>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} kg
          </span>
          {hint && <span className={cn("ml-1", emphasize ? "text-background/50" : "text-muted-foreground")}>{hint}</span>}
        </div>
      )}
      {delta == null && hint && (
        <p className={cn("mt-2 text-xs", emphasize ? "text-background/50" : "text-muted-foreground")}>{hint}</p>
      )}
    </div>
  );
}
