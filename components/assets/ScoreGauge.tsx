"use client";

import * as React from "react";
import {
  ShieldCheck,
  TrendingUp,
  Eye,
  Image as ImageIcon,
  Sun,
  Crop,
  Lock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdown } from "@/types/audit";

export interface ScoreGaugeProps {
  scoreBefore?: number;
  scoreAfter?: number;
  breakdown?: Partial<ScoreBreakdown>;
  detectedIssues?: string[];
  repairActions?: string[];
  className?: string;
}

export function ScoreGauge({
  scoreBefore = 42,
  scoreAfter = 94,
  breakdown = {
    product_visibility: 94,
    background_quality: 95,
    lighting_quality: 88,
    composition: 90,
    brand_safety: 98,
  },
  detectedIssues = [],
  repairActions = [],
  className = "",
}: ScoreGaugeProps) {
  const delta = scoreAfter - scoreBefore;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreAfter / 100) * circumference;

  const scoreColor =
    scoreAfter >= 80
      ? "text-emerald-500 stroke-emerald-500"
      : scoreAfter >= 65
        ? "text-amber-500 stroke-amber-500"
        : "text-rose-500 stroke-rose-500";

  const dimensions = [
    {
      label: "Product Prominence",
      value: breakdown.product_visibility ?? 90,
      icon: Eye,
      description: "Clarity, focus, and subject isolation",
    },
    {
      label: "Background Quality",
      value: breakdown.background_quality ?? 92,
      icon: ImageIcon,
      description: "Clean studio setting without clutter",
    },
    {
      label: "Lighting & Exposure",
      value: breakdown.lighting_quality ?? 88,
      icon: Sun,
      description: "Balanced dynamic range & soft shadows",
    },
    {
      label: "Composition & Margins",
      value: breakdown.composition ?? 90,
      icon: Crop,
      description: "Marketplace-compliant centering & framing",
    },
    {
      label: "Brand Safety Policy",
      value: breakdown.brand_safety ?? 100,
      icon: Lock,
      description: "Freedom from watermarks & copyright stamps",
    },
  ];

  return (
    <Card
      className={`border-border/70 bg-card/80 shadow-xl backdrop-blur-xl ${className}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>Commerce Readiness Audit</span>
          </CardTitle>
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
          >
            {scoreAfter >= 70 ? "PASSED QUALITY GATE" : "SUB-THRESHOLD"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border/60 bg-muted/20 p-5">
          <div className="relative flex size-36 shrink-0 items-center justify-center">
            <svg
              className="size-full -rotate-90 transform"
              viewBox="0 0 130 130"
            >
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-muted/40"
                strokeWidth="10"
                fill="none"
              />

              <circle
                cx="65"
                cy="65"
                r={radius}
                className={`transition-all duration-1000 ease-out ${scoreColor}`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black tracking-tight text-foreground">
                {scoreAfter}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Score / 100
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                <span>+{delta} Points Improvement</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Autonomous AI Quality Repair
              </p>
              <p className="text-xs text-muted-foreground">
                Raw capture improved from{" "}
                <span className="font-bold text-rose-500">{scoreBefore}</span>{" "}
                to{" "}
                <span className="font-bold text-emerald-500">{scoreAfter}</span>{" "}
                verified.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg border border-border/50 bg-background/50 p-2 text-center">
                <span className="block text-[10px] uppercase text-muted-foreground font-medium">
                  Initial Score
                </span>
                <span className="text-sm font-bold text-rose-500">
                  {scoreBefore}/100
                </span>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-2 text-center">
                <span className="block text-[10px] uppercase text-muted-foreground font-medium">
                  Verified Score
                </span>
                <span className="text-sm font-bold text-emerald-500">
                  {scoreAfter}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            5-Dimension Sub-Score Analysis
          </p>
          <div className="space-y-2.5">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              const barColor =
                dim.value >= 85
                  ? "bg-emerald-500"
                  : dim.value >= 70
                    ? "bg-amber-500"
                    : "bg-rose-500";

              return (
                <div key={dim.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span>{dim.label}</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">
                      {dim.value}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                      style={{ width: `${dim.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(detectedIssues.length > 0 || repairActions.length > 0) && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            {detectedIssues.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-500">
                  <AlertTriangle className="size-3" />
                  <span>Detected Raw Smartphone Defects:</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {detectedIssues.map((issue, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="border border-border bg-background/80 text-[11px] font-normal"
                    >
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {repairActions.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
                  <Sparkles className="size-3" />
                  <span>Cloudinary AI Repairs Applied:</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {repairActions.map((action, idx) => (
                    <Badge
                      key={idx}
                      className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono"
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
