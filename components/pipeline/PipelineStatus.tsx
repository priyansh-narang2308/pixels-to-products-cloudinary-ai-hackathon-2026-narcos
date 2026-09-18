/* eslint-disable react-hooks/purity */
"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Search,
  Sliders,
  Wand2,
  ShieldCheck,
  PackageCheck,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PipelineEvent, PipelineStep, StepStatus } from "@/lib/sse";

export interface PipelineStatusProps {
  assetId: string;
  onComplete?: (data: Record<string, unknown>) => void;
  onError?: (err: string) => void;
  initialEventsUrl?: string;
}

interface StepDefinition {
  id: PipelineStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_STEPS: StepDefinition[] = [
  {
    id: "upload",
    title: "1. Media Ingestion",
    description: "Cloudinary upload & DB registration",
    icon: PackageCheck,
  },
  {
    id: "audit_1",
    title: "2. Cognitive Audit #1",
    description: "AI vision flaw detection & scoring",
    icon: Search,
  },
  {
    id: "decision",
    title: "3. Autonomous Routing",
    description: "Policy gate & prompt synthesis",
    icon: Sliders,
  },
  {
    id: "transform",
    title: "4. Generative AI Repair",
    description: "Studio background replace & lighting",
    icon: Wand2,
  },
  {
    id: "audit_2",
    title: "5. Closed-Loop Audit #2",
    description: "Post-repair verification (>= 70 Gate)",
    icon: ShieldCheck,
  },
  {
    id: "compile",
    title: "6. Omnichannel Compilation",
    description: "Compiling 5-variant commerce family",
    icon: Sparkles,
  },
];

export function PipelineStatus({
  assetId,
  onComplete,
  onError,
  initialEventsUrl,
}: PipelineStatusProps) {
  const [currentStep, setCurrentStep] = React.useState<PipelineStep>("upload");
  const [stepStatuses, setStepStatuses] = React.useState<
    Record<PipelineStep, StepStatus>
  >({
    upload: "in_progress",
    audit_1: "idle",
    decision: "idle",
    transform: "idle",
    audit_2: "idle",
    compile: "idle",
    complete: "idle",
    error: "idle",
  });
  const [progress, setProgress] = React.useState<number>(10);
  const [statusMessage, setStatusMessage] = React.useState<string>(
    "Connecting to real-time compilation engine...",
  );

  const [startTime] = React.useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0);
  const [isFinished, setIsFinished] = React.useState<boolean>(false);
  const [hasError, setHasError] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  React.useEffect(() => {
    if (!assetId) return;

    const eventsUrl = initialEventsUrl || `/api/events?assetId=${assetId}`;
    console.log(`[PipelineStatus] Connecting to SSE: ${eventsUrl}`);
    const eventSource = new EventSource(eventsUrl);

    eventSource.addEventListener("pipeline", (e: MessageEvent) => {
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        console.log(
          "[PipelineStatus Event]:",
          event.step,
          event.status,
          event.message,
        );

        if (event.step) {
          setCurrentStep(event.step);
          setStepStatuses((prev) => ({
            ...prev,
            [event.step]: event.status,
          }));
        }

        if (event.progress !== undefined) {
          setProgress(event.progress);
        }

        if (event.message) {
          setStatusMessage(event.message);
        }

        if (event.step === "complete" && event.status === "complete") {
          setIsFinished(true);
          setProgress(100);
          eventSource.close();
          if (onComplete) {
            onComplete(event.data || {});
          }
        }

        if (event.status === "failed") {
          setHasError(true);
          if (event.step === "decision" || event.step === "audit_2") {
            setIsFinished(true);
            eventSource.close();
            if (onError) onError(event.message || "Quality Gate Rejection");
          }
        }
      } catch (parseErr) {
        console.error("[PipelineStatus] Failed to parse SSE event:", parseErr);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("[PipelineStatus] SSE connection notice:", err);

      if (isFinished) {
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [assetId, initialEventsUrl, isFinished, onComplete, onError]);

  return (
    <Card className="border-border/70 bg-card/80 shadow-xl backdrop-blur-xl transition-all">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isFinished ? (
                hasError ? (
                  <AlertTriangle className="size-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )
              ) : (
                <Loader2 className="size-5 animate-spin text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Autonomous Compilation Pipeline
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Asset ID:{" "}
                <span className="font-mono text-foreground/80">{assetId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5" />
              <span>{elapsedSeconds}s</span>
            </div>

            <Badge
              variant="outline"
              className={
                isFinished
                  ? hasError
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-primary/40 bg-primary/10 text-primary animate-pulse"
              }
            >
              {isFinished
                ? hasError
                  ? "Rejected by Gate"
                  : "Compile Verified"
                : "Active Pipeline"}
            </Badge>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-foreground/90">{statusMessage}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const status = stepStatuses[step.id];
            const isCurrent = currentStep === step.id && !isFinished;
            const isDone =
              status === "complete" ||
              (progress >= 100 && !hasError) ||
              idx < PIPELINE_STEPS.findIndex((s) => s.id === currentStep);

            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-3 rounded-xl border p-3 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                    : isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : status === "failed"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border/50 bg-background/40 opacity-70"
                }`}
              >
                <div
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : status === "failed"
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4" />
                  ) : isCurrent ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {step.title}
                    </p>
                    {isDone && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        DONE
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <ChevronRight className="size-3.5 text-primary shrink-0 animate-pulse" />
          <span className="font-mono truncate">{statusMessage}</span>
        </div>
      </CardContent>
    </Card>
  );
}
