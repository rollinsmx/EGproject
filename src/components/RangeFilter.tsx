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
    <div className="-mx-1 flex w-full overflow-x-auto sm:w-auto sm:overflow-visible">
      <div className="mx-1 inline-flex rounded-full border bg-card p-1 text-sm">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:text-sm",
              value === o.key
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
