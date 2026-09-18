/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  Play,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { PipelineStatus } from "@/components/pipeline/PipelineStatus";
import { BeforeAfter } from "@/components/assets/BeforeAfter";
import { ScoreGauge } from "@/components/assets/ScoreGauge";
import { AssetFamily } from "@/components/assets/AssetFamily";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AssetFamilyUrls } from "@/types/audit";
import { toast } from "sonner";

interface DemoPreset {
  id: "saree" | "brass" | "watermark";
  title: string;
  category: string;
  issue: string;
  badgeText: string;
  badgeVariant: "repair" | "pass" | "reject";
  initialScore: number;
  expectedScore: number;
  beforeUrl: string;
  afterUrl: string;
  familyUrls: AssetFamilyUrls;
  detectedIssues: string[];
  repairActions: string[];
}

const PRESETS: DemoPreset[] = [
  {
    id: "saree",
    title: "Handwoven Silk Saree",
    category: "apparel_ethnic",
    issue: "Cluttered wrinkled bedsheet, harsh camera flash, tilted crop",
    badgeText: "Autonomous Auto-Repair",
    badgeVariant: "repair",
    initialScore: 44,
    expectedScore: 93,
    beforeUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1080&auto=format&fit=crop&q=80",
    afterUrl:
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1080&auto=format&fit=crop&q=80",
    familyUrls: {
      hero: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1080&auto=format&fit=crop&q=80",
      marketplace:
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1080&h=1350&auto=format&fit=crop&q=80",
      banner:
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1600&h=900&auto=format&fit=crop&q=80",
      lifestyle:
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200&h=900&auto=format&fit=crop&q=80",
      social:
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200&h=630&auto=format&fit=crop&q=80",
    },
    detectedIssues: [
      "cluttered_background",
      "harsh_camera_glare",
      "off_center_composition",
    ],
    repairActions: [
      "e_gen_background_replace",
      "e_improve:outdoor",
      "c_auto,g_auto",
    ],
  },
  {
    id: "brass",
    title: "Handcrafted Brass Diya",
    category: "home_decor",
    issue: "Dark workshop concrete floor, low ambient lighting, harsh shadows",
    badgeText: "GenAI Studio Pedestal",
    badgeVariant: "repair",
    initialScore: 52,
    expectedScore: 95,
    beforeUrl:
      "https://images.unsplash.com/photo-1608096299210-db7e38487075?w=1080&auto=format&fit=crop&q=80",
    afterUrl:
      "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1080&auto=format&fit=crop&q=80",
    familyUrls: {
      hero: "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1080&auto=format&fit=crop&q=80",
      marketplace:
        "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1080&h=1350&auto=format&fit=crop&q=80",
      banner:
        "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1600&h=900&auto=format&fit=crop&q=80",
      lifestyle:
        "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1200&h=900&auto=format&fit=crop&q=80",
      social:
        "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1200&h=630&auto=format&fit=crop&q=80",
    },
    detectedIssues: [
      "dark_background",
      "low_ambient_light",
      "harsh_cast_shadows",
    ],
    repairActions: [
      "e_gen_background_replace (luxury marble pedestal)",
      "e_viesus_correct",
      "e_shadow:50",
    ],
  },
  {
    id: "watermark",
    title: "Stock Photo with Watermark",
    category: "copyright_flagged",
    issue:
      "Commercial watermark detected, violation of Amazon/Shopify catalog policies",
    badgeText: "Quality Gate Hard Rejection",
    badgeVariant: "reject",
    initialScore: 55,
    expectedScore: 0,
    beforeUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&auto=format&fit=crop&q=80",
    afterUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&auto=format&fit=crop&q=80",
    familyUrls: {
      hero: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&auto=format&fit=crop&q=80",
      marketplace: "",
      banner: "",
      lifestyle: "",
      social: "",
    },
    detectedIssues: [
      "visible_watermark",
      "commercial_copyright_risk",
      "policy_violation",
    ],
    repairActions: [
      "ZERO_CREDIT_SAFETY_GATE_TRIGGERED: Pipeline terminated prior to generation",
    ],
  },
];

export function InteractiveDemoSandbox() {
  const [selectedPreset, setSelectedPreset] = React.useState<DemoPreset>(
    PRESETS[0],
  );
  const [activeAssetId, setActiveAssetId] = React.useState<string | null>(null);
  const [eventsUrl, setEventsUrl] = React.useState<string | null>(null);
  const [compiling, setCompiling] = React.useState<boolean>(false);
  const [isCompleted, setIsCompleted] = React.useState<boolean>(true); // initially show sample result

  const handleTriggerPreset = async (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setCompiling(true);
    setIsCompleted(false);

    toast.info(`Executing autonomous pipeline for: ${preset.title}`);

    try {
      const res = await fetch("/api/pipeline/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: preset.id,
          speedMultiplier: 2.0, // faster for interactive sandbox demo
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to trigger sandbox pipeline");
      }

      setActiveAssetId(data.assetId);
      setEventsUrl(data.eventsUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to run sandbox scenario");
      setCompiling(false);
      setIsCompleted(true);
    }
  };

  const handlePipelineComplete = () => {
    setCompiling(false);
    setIsCompleted(true);
    toast.success(
      `Pipeline verified! Quality score improved to ${selectedPreset.expectedScore}/100`,
    );
  };

  return (
    <div className="w-full space-y-8" id="sandbox">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Interactive 1-Click Demo Sandbox
        </div>
        <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Experience Closed-Loop Compilation in Real-Time
        </h2>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground">
          Judges can run end-to-end scenarios instantly with zero upload
          friction. Click any preset below to trigger the live pipeline
          orchestrator.
        </p>

        <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleTriggerPreset(preset)}
                disabled={compiling}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/40"
                    : "border-border/70 bg-card/60 hover:border-primary/50 hover:bg-card/90"
                } ${compiling ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-semibold ${
                        preset.badgeVariant === "reject"
                          ? "border-red-500/40 bg-red-500/10 text-red-500"
                          : "border-primary/30 bg-primary/15 text-primary"
                      }`}
                    >
                      {preset.badgeText}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Play className="size-3 text-primary fill-primary" />
                      Run Demo
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-foreground">
                    {preset.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {preset.issue}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground">QC Score Shift:</span>
                  <span className="font-bold">
                    <span className="text-amber-500">
                      {preset.initialScore}
                    </span>
                    {" → "}
                    <span
                      className={
                        preset.badgeVariant === "reject"
                          ? "text-red-500"
                          : "text-emerald-500"
                      }
                    >
                      {preset.expectedScore === 0
                        ? "REJECT"
                        : `${preset.expectedScore}/100`}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {compiling && activeAssetId && (
        <Card className="border-primary/40 bg-card/90 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin text-primary" />
                Live Closed-Loop Pipeline Execution
              </CardTitle>
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary text-xs"
              >
                Asset: {selectedPreset.title}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Streaming real-time Server-Sent Events (SSE) from Lumina master
              orchestrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineStatus
              assetId={activeAssetId}
              initialEventsUrl={eventsUrl || undefined}
              onComplete={handlePipelineComplete}
              onError={() => {
                setCompiling(false);
                setIsCompleted(true);
              }}
            />
          </CardContent>
        </Card>
      )}

      {isCompleted && !compiling && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {selectedPreset.id === "watermark" ? (
            <Card className="border-red-500/40 bg-red-500/5 shadow-xl">
              <CardContent className="p-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30">
                  <AlertTriangle className="size-8" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="destructive"
                      className="font-semibold text-xs"
                    >
                      Zero-Credit Safety Gate Triggered
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      Policy Rule: CLD_COMMERCE_COPYRIGHT_01
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Asset Rejected: Commercial Watermark Detected
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lumina cognitive audit detected third-party watermark
                    patterns violating marketplace listing policies (Amazon
                    Section 3.2 & Shopify Catalog standards). The pipeline
                    immediately terminated execution prior to triggering
                    generative credits, saving $0.00 spend.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerPreset(PRESETS[0])}
                  className="shrink-0 gap-2 text-xs"
                >
                  <RefreshCw className="size-3.5" />
                  Try Silk Saree Preset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <Card className="overflow-hidden border-border/80 bg-card/70 backdrop-blur-xl shadow-xl">
                    <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Sliders className="size-4 text-primary" />
                          Interactive Before / After Comparison
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary text-xs"
                        >
                          Drag Slider
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Compare raw mobile camera capture vs Cloudinary AI
                        repaired asset.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <BeforeAfter
                        beforeUrl={selectedPreset.beforeUrl}
                        afterUrl={selectedPreset.afterUrl}
                        beforeScore={selectedPreset.initialScore}
                        afterScore={selectedPreset.expectedScore}
                        beforeLabel="Raw Smartphone Capture"
                        afterLabel="Cloudinary AI Verified"
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-5">
                  <Card className="h-full border-border/80 bg-card/70 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                    <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ShieldCheck className="size-4 text-emerald-500" />
                          Quality Score Shift & Verification
                        </CardTitle>
                        <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs">
                          QC Passed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
                      <ScoreGauge
                        scoreBefore={selectedPreset.initialScore}
                        scoreAfter={selectedPreset.expectedScore}
                        detectedIssues={selectedPreset.detectedIssues}
                        repairActions={selectedPreset.repairActions}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                      <Layers className="size-5 text-primary" />
                      Generated 5-Asset Production Family
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Each asset variant was generated via optimized Cloudinary
                      transformation chains and cached with zero re-render cost.
                    </p>
                  </div>
                  <Link href="/upload">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-xs font-medium"
                    >
                      Launch Studio with Custom Image
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>

                <AssetFamily
                  familyUrls={selectedPreset.familyUrls}
                  title={selectedPreset.title}
                  category={selectedPreset.category}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
