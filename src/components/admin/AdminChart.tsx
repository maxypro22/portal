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
import { useTheme } from "@/components/ThemeProvider";

export type ChartPoint = { label: string; count: number; isToday?: boolean };

/**
 * 14-day bookings-per-day bar chart. Recharts needs literal color values
 * (SVG props, not Tailwind classes), so it can't pick up the CSS-variable
 * theme automatically — colors are branched here based on the current theme.
 */
export function AdminChart({ data }: { data: ChartPoint[] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const max = Math.max(1, ...data.map((d) => d.count));

  const tickColor = isLight ? "#6b7280" : "#a99f92";
  const axisLineColor = isLight ? "#e0e3eb" : "#4a3c3c";
  const tooltipBg = isLight ? "#ffffff" : "#241d1d";
  const tooltipText = isLight ? "#1c1c20" : "#f5efe6";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={{ stroke: axisLineColor }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, max + 1]}
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(201,162,39,0.08)" }}
            contentStyle={{
              background: tooltipBg,
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: 12,
              color: tooltipText,
              fontSize: 13,
            }}
            labelStyle={{ color: "#c9a227", fontWeight: 600 }}
            itemStyle={{ color: tooltipText }}
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
