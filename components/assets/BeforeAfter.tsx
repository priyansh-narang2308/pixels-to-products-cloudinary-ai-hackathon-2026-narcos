/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { SlidersHorizontal, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface BeforeAfterProps {
  beforeUrl: string;
  afterUrl: string;
  beforeScore?: number;
  afterScore?: number;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: "square" | "portrait" | "video" | "auto";
  className?: string;
}

export function BeforeAfter({
  beforeUrl,
  afterUrl,
  beforeScore = 42,
  afterScore = 94,
  beforeLabel = "Raw Smartphone Photo",
  afterLabel = "Cloudinary AI Repaired",
  aspectRatio = "square",
  className = "",
}: BeforeAfterProps) {
  const [sliderPos, setSliderPos] = React.useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = React.useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "portrait"
        ? "aspect-[4/5]"
        : aspectRatio === "video"
          ? "aspect-video"
          : "aspect-square";

  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-2xl ${aspectClass} ${className}`}
      ref={containerRef}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      <div className="absolute inset-0 size-full">
        <img
          src={beforeUrl}
          alt="Raw artisan capture before AI enhancement"
          className="size-full object-cover"
          draggable={false}
        />

        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-semibold backdrop-blur-md"
          >
            <AlertCircle className="mr-1 size-3 text-amber-500" />
            <span>{beforeLabel}</span>
          </Badge>
          <Badge className="bg-destructive/90 text-white font-bold text-xs">
            {beforeScore}/100
          </Badge>
        </div>
      </div>

      <div
        className="absolute inset-0 size-full overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
      >
        <img
          src={afterUrl}
          alt="Clean studio product image after Cloudinary AI repair"
          className="size-full object-cover"
          draggable={false}
        />

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white font-bold text-xs shadow-md">
            {afterScore}/100
          </Badge>
          <Badge
            variant="secondary"
            className="border border-emerald-500/40 bg-background/80 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-md"
          >
            <Sparkles className="mr-1 size-3 text-emerald-500" />
            <span>{afterLabel}</span>
          </Badge>
        </div>
      </div>

      <div
        className="absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)]"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-9 cursor-ew-resize items-center justify-center rounded-full border-2 border-white bg-background/90 text-foreground shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95">
          <SlidersHorizontal className="size-4 text-primary" />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full border border-border/80 bg-background/70 px-3 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-md pointer-events-none">
        Drag slider to compare transformation
      </div>
    </div>
  );
}
