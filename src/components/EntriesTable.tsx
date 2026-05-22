import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WeightEntry } from "@/lib/sheets.functions";

interface Props {
  entries: WeightEntry[];
}

export function EntriesTable({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [desc, setDesc] = useState(true);
  const [limit, setLimit] = useState(20);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = entries;
    if (q) {
      list = entries.filter(
        (e) =>
          e.notes.toLowerCase().includes(q) ||
          e.date.includes(q) ||
          format(parseISO(e.date), "MMM d, yyyy").toLowerCase().includes(q) ||
          String(e.weight).includes(q),
      );
    }
    list = [...list].sort((a, b) => (desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
    return list;
  }, [entries, query, desc]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDesc((d) => !d)}
          className="gap-2 self-start sm:self-auto"
        >
          <ArrowUpDown className="h-4 w-4" />
          {desc ? "Newest first" : "Oldest first"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Weight</th>
              <th className="px-4 py-2.5 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr
                key={e.date + "-" + e.weight}
                className="border-b last:border-0 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 num text-foreground">
                  {format(parseISO(e.date), "EEE, MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 num font-medium">{e.weight.toFixed(1)} kg</td>
                <td className="px-4 py-3 text-muted-foreground">{e.notes || "—"}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  No entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > limit && (
        <div className="border-t p-3 text-center">
          <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + 30)}>
            Show more ({filtered.length - limit} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
