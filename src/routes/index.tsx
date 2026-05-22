import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { differenceInDays, format, parseISO, subDays, subMonths } from "date-fns";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { getEntries, type WeightEntry } from "@/lib/sheets.functions";
import { StatCard } from "@/components/StatCard";
import { WeightChart } from "@/components/WeightChart";
import { MonthlyComparison } from "@/components/MonthlyComparison";
import { EntryForm } from "@/components/EntryForm";
import { EntriesTable } from "@/components/EntriesTable";
import { RangeFilter, type RangeKey } from "@/components/RangeFilter";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const entriesQuery = queryOptions({
  queryKey: ["entries"],
  queryFn: () => getEntries(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(entriesQuery),
  head: () => ({
    meta: [
      { title: "Weight — Daily tracking & trends" },
      { name: "description", content: "Personal weight tracking dashboard with trends, moving averages and monthly comparisons." },
    ],
  }),
  component: Dashboard,
});

function filterByRange(entries: WeightEntry[], range: RangeKey): WeightEntry[] {
  if (range === "all" || entries.length === 0) return entries;
  const last = parseISO(entries[entries.length - 1].date);
  let from: Date;
  if (range === "30d") from = subDays(last, 30);
  else if (range === "3m") from = subMonths(last, 3);
  else from = subMonths(last, 6);
  const fromIso = format(from, "yyyy-MM-dd");
  return entries.filter((e) => e.date >= fromIso);
}

function Dashboard() {
  const { data } = useSuspenseQuery(entriesQuery);
  const all = data.entries;
  const [range, setRange] = useState<RangeKey>("3m");

  const filtered = useMemo(() => filterByRange(all, range), [all, range]);

  const stats = useMemo(() => computeStats(all), [all]);
  const trend = useMemo(() => computeTrend(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Weight
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {all.length > 0
                ? `${all.length} entries · last logged ${format(parseISO(all[all.length - 1].date), "MMM d, yyyy")}`
                : "No entries yet"}
            </p>
          </div>
          <EntryForm />
        </header>

        {all.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stat cards */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard
                label="Current"
                value={stats.current.toFixed(1)}
                unit="kg"
                emphasize
                hint={`as of ${format(parseISO(all[all.length - 1].date), "MMM d")}`}
              />
              <StatCard label="This week" value={fmtDelta(stats.weeklyChange)} unit="kg" delta={stats.weeklyChange} hint="vs 7d ago" />
              <StatCard label="This month" value={fmtDelta(stats.monthlyChange)} unit="kg" delta={stats.monthlyChange} hint="vs 30d ago" />
              <StatCard label="All time" value={fmtDelta(stats.totalChange)} unit="kg" delta={stats.totalChange} hint="since start" />
              <StatCard label="Avg this month" value={stats.monthAvg.toFixed(1)} unit="kg" hint={format(new Date(), "MMMM")} />
              <StatCard label="Min / Max" value={`${stats.min.toFixed(1)} / ${stats.max.toFixed(1)}`} unit="kg" hint="all entries" />
            </section>

            {/* Trend chart */}
            <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Trend</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendBadge slope={trend.slope} />
                    <span className="num">{trend.label}</span>
                  </div>
                </div>
                <RangeFilter value={range} onChange={setRange} />
              </div>
              {filtered.length > 1 ? (
                <WeightChart entries={filtered} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Not enough data in this range.
                </p>
              )}
            </section>

            {/* Monthly comparison */}
            <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight">Month by month</h2>
              <p className="mt-1 text-xs text-muted-foreground">Average weight per calendar month.</p>
              <div className="mt-4">
                <MonthlyComparison entries={all} />
              </div>
            </section>

            {/* Table */}
            <section className="mt-6">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Entries</h2>
                <span className="text-xs text-muted-foreground num">{all.length} total</span>
              </div>
              <EntriesTable entries={all} />
            </section>

            <footer className="mt-10 text-center text-xs text-muted-foreground">
              Synced live with Google Sheets · {format(new Date(), "MMM d, yyyy")}
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border bg-card p-12 text-center">
      <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold">No entries yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Log your first weight to get started.</p>
    </div>
  );
}

function TrendBadge({ slope }: { slope: number }) {
  let label: string;
  let cls: string;
  let Icon = Activity;
  if (slope < -0.02) {
    label = "Losing";
    cls = "bg-success/10 text-success";
    Icon = TrendingDown;
  } else if (slope > 0.02) {
    label = "Gaining";
    cls = "bg-warning/10 text-warning";
    Icon = TrendingUp;
  } else {
    label = "Stable";
    cls = "bg-muted text-muted-foreground";
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function fmtDelta(n: number): string {
  if (Math.abs(n) < 0.05) return "0.0";
  return (n > 0 ? "+" : "") + n.toFixed(1);
}

function computeStats(entries: WeightEntry[]) {
  if (entries.length === 0) {
    return { current: 0, weeklyChange: 0, monthlyChange: 0, totalChange: 0, monthAvg: 0, min: 0, max: 0 };
  }
  const last = entries[entries.length - 1];
  const lastDate = parseISO(last.date);
  const findPrev = (days: number) => {
    const target = subDays(lastDate, days);
    let best: WeightEntry | null = null;
    let bestDiff = Infinity;
    for (const e of entries) {
      const d = Math.abs(differenceInDays(parseISO(e.date), target));
      if (d < bestDiff) {
        bestDiff = d;
        best = e;
      }
    }
    return best;
  };
  const weekAgo = findPrev(7);
  const monthAgo = findPrev(30);
  const first = entries[0];

  const monthKey = last.date.slice(0, 7);
  const monthEntries = entries.filter((e) => e.date.startsWith(monthKey));
  const monthAvg = monthEntries.reduce((a, b) => a + b.weight, 0) / monthEntries.length;

  const weights = entries.map((e) => e.weight);

  return {
    current: last.weight,
    weeklyChange: weekAgo ? last.weight - weekAgo.weight : 0,
    monthlyChange: monthAgo ? last.weight - monthAgo.weight : 0,
    totalChange: last.weight - first.weight,
    monthAvg,
    min: Math.min(...weights),
    max: Math.max(...weights),
  };
}

function computeTrend(entries: WeightEntry[]) {
  if (entries.length < 2) return { slope: 0, label: "—" };
  // simple linear regression slope (kg per day)
  const x0 = parseISO(entries[0].date).getTime();
  const xs = entries.map((e) => (parseISO(e.date).getTime() - x0) / (1000 * 60 * 60 * 24));
  const ys = entries.map((e) => e.weight);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const perWeek = slope * 7;
  const label = `${perWeek >= 0 ? "+" : ""}${perWeek.toFixed(2)} kg / week`;
  return { slope, label };
}
