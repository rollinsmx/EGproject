import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import type { WeightEntry } from "@/lib/sheets.functions";

interface Props {
  entries: WeightEntry[];
}

export function MonthlyComparison({ entries }: Props) {
  const byMonth = new Map<string, number[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e.weight);
  }
  const data = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      month,
      avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
      min: Math.min(...vals),
      max: Math.max(...vals),
    }));

  const all = data.flatMap((d) => [d.min, d.max]);
  const yMin = Math.floor(Math.min(...all) - 1);
  const yMax = Math.ceil(Math.max(...all) + 1);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(v) => format(parseISO(v + "-01"), "MMM")}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
              padding: "10px 12px",
            }}
            labelFormatter={(v) => format(parseISO(v + "-01"), "MMMM yyyy")}
            formatter={(v: number) => [`${v.toFixed(1)} kg`, "Monthly avg"]}
          />
          <Bar dataKey="avg" fill="var(--color-accent)" radius={[8, 8, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
