/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Eye,
  ImageIcon,
  Sun,
  Crop,
  Lock,
  Activity,
  PieChartIcon,
  BarChart3,
} from "lucide-react";

interface StatusItem {
  name: string;
  value: number;
  fill: string;
}

interface FlawItem {
  name: string;
  count: number;
  icon: string;
}

interface DailyItem {
  date: string;
  count: number;
}

interface CategoryItem {
  name: string;
  count: number;
}

interface AnalyticsChartsProps {
  statusDistribution: StatusItem[];
  topFlaws: FlawItem[];
  dailyThroughput: DailyItem[];
  categories: CategoryItem[];
  totalAssets: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-xl">
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-foreground">
          <span
            className="inline-block size-2.5 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function renderCustomLabel(props: any) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
  } = props;
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius =
    Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > Number(cx) ? "start" : "end"}
      dominantBaseline="central"
      className="text-[11px] font-semibold fill-foreground"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const FLAW_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-5)",
  "var(--color-chart-4)",
  "var(--color-chart-1)",
];

const FLAW_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  ImageIcon: ImageIcon,
  Sun: Sun,
  Crop: Crop,
  Lock: Lock,
  Eye: Eye,
  AlertTriangle: AlertTriangle,
};

export function AnalyticsCharts({
  statusDistribution,
  topFlaws,
  dailyThroughput,
  totalAssets,
}: AnalyticsChartsProps) {
  const hasData = totalAssets > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="size-4 text-primary" />
              QC Status Distribution
            </CardTitle>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary text-xs"
            >
              {totalAssets} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <EmptyState message="Process assets to see QC distribution" />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-55">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                      stroke="none"
                    >
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2.5">
                {statusDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="size-4 text-amber-500" />
              Top Detected Flaws
            </CardTitle>
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs"
            >
              AI Vision Diagnostics
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {topFlaws.length === 0 ? (
            <EmptyState message="No flaws detected yet" />
          ) : (
            <div className="space-y-3">
              {topFlaws.map((flaw, i) => {
                const maxCount = Math.max(...topFlaws.map((f) => f.count), 1);
                const pct = Math.round((flaw.count / maxCount) * 100);
                const IconComp = FLAW_ICONS[flaw.icon] || AlertTriangle;

                return (
                  <div key={flaw.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <IconComp className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground truncate max-w-50">
                          {flaw.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums font-mono">
                        {flaw.count}×
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: FLAW_COLORS[i % FLAW_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80 backdrop-blur-xl shadow-lg lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-4 text-emerald-500" />
              Daily Processing Throughput
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
            >
              Last 14 Days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <EmptyState message="Process assets to see throughput trends" />
          ) : (
            <div className="h-65 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyThroughput}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="throughputGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/30"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    className="text-[11px] fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    className="text-[11px] fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Assets Compiled"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#throughputGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
        <BarChart3 className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Upload media in the Studio to populate analytics.
      </p>
    </div>
  );
}
