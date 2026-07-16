"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export type ChartPoint = { label: string; count: number; isToday?: boolean };

/** 14-day bookings-per-day bar chart. */
export function AdminChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#a99f92", fontSize: 11 }}
            axisLine={{ stroke: "#4a3c3c" }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, max + 1]}
            tick={{ fill: "#a99f92", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(201,162,39,0.08)" }}
            contentStyle={{
              background: "#241d1d",
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: 12,
              color: "#f5efe6",
              fontSize: 13,
            }}
            labelStyle={{ color: "#c9a227", fontWeight: 600 }}
            formatter={(value: number) => [`${value} bookings`, ""]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={38}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.isToday ? "#e0c05a" : "#9a7f2e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
