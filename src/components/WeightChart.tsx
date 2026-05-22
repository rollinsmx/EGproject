import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import type { WeightEntry } from "@/lib/sheets.functions";

interface Props {
  entries: WeightEntry[];
}

export function WeightChart({ entries }: Props) {
  // Build 7-day moving avg
  const data = entries.map((e, i) => {
    const windowStart = Math.max(0, i - 6);
    const slice = entries.slice(windowStart, i + 1);
    const avg = slice.reduce((a, b) => a + b.weight, 0) / slice.length;
    return {
      date: e.date,
      weight: e.weight,
      avg: Number(avg.toFixed(2)),
    };
  });

  const weights = entries.map((e) => e.weight);
  const min = Math.floor(Math.min(...weights) - 1);
  const max = Math.ceil(Math.max(...weights) + 1);

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => format(parseISO(v), "MMM d")}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={[min, max]}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
              padding: "10px 12px",
              boxShadow: "0 4px 20px -4px rgb(0 0 0 / 0.08)",
            }}
            labelFormatter={(v) => format(parseISO(v as string), "EEE, MMM d, yyyy")}
            formatter={(v: number, name) => [
              `${v.toFixed(1)} kg`,
              name === "weight" ? "Weight" : "7-day avg",
            ]}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            fill="url(#weightFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-accent)", stroke: "var(--color-background)", strokeWidth: 2 }}
            animationDuration={600}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="var(--color-foreground)"
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
