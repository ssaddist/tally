import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../i18n/I18nProvider";

interface Props {
  data: { category: string; monthly: number }[];
  currency: string;
}

export function SpendChart({ data, currency }: Props) {
  const tr = useI18n();
  const height = Math.max(120, data.length * 40);
  return (
    <div style={{ height }} role="img" aria-label={tr.t("dashboard.chartLabel")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            width={120}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 3,
              color: "var(--text)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--text)" }}
            itemStyle={{ color: "var(--text)" }}
            formatter={(value) => [tr.money(Number(value), currency), tr.t("dashboard.chartTooltip")]}
          />
          <Bar dataKey="monthly" fill="var(--text)" radius={0} barSize={12} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
