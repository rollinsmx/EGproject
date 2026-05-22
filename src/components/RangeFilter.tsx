import { cn } from "@/lib/utils";

export type RangeKey = "30d" | "3m" | "6m" | "all" | "custom";

interface Props {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "30d", label: "30 days" },
  { key: "3m", label: "3 months" },
  { key: "6m", label: "6 months" },
  { key: "all", label: "All time" },
];

export function RangeFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border bg-card p-1 text-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-all duration-200",
            value === o.key
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
