/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  Film,
  Zap,
  Layers,
  UploadCloud,
  Info,
  Radio,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { ProductVideoPlayer } from "@/components/video/ProductVideoPlayer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SAMPLE_VIDEOS = [
  {
    id: "samples/sea-turtle",
    title: "Artisan Silk Saree — 360° Dynamic Drape",
    category: "apparel_ethnic",
    description:
      "Captured on mobile camera. Compiled into adaptive HLS (sp_auto) with multi-bitrate profiles for 4G, 5G, and WiFi.",
    badge: "HLS Adaptive (1080p -> 360p)",
    initialPublicId: "samples/sea-turtle",
  },
  {
    id: "samples/elephants",
    title: "Handcrafted Brass Diya — Detail & Reflection",
    category: "home_decor",
    description:
      "Ultra-low latency streaming with eager HLS transcoding. Auto-generates middle-frame poster and mp4 fallback.",
    badge: "sp_auto Profile",
    initialPublicId: "samples/elephants",
  },
  {
    id: "samples/cld-sample-video",
    title: "Leather Artisan Studio — Texture & Grain Reveal",
    category: "footwear_leather",
    description:
      "Cloudinary native adaptive bitrate delivery with instant switching across network fluctuation.",
    badge: "Multi-Bitrate Stream",
    initialPublicId: "samples/cld-sample-video",
  },
];

export default function VideoStreamPage() {
  const [selectedVideo, setSelectedVideo] = React.useState(SAMPLE_VIDEOS[0]);
  const [customPublicId, setCustomPublicId] = React.useState("");
  const [activePublicId, setActivePublicId] = React.useState(
    SAMPLE_VIDEOS[0].initialPublicId,
  );
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelectSample = (sample: (typeof SAMPLE_VIDEOS)[0]) => {
    setSelectedVideo(sample);
    setActivePublicId(sample.initialPublicId);
    toast.success(`Loaded video: ${sample.title}`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPublicId.trim()) return;
    setActivePublicId(customPublicId.trim());
    setSelectedVideo({
      id: customPublicId.trim(),
      title: "Custom Cloudinary Video Asset",
      category: "custom_media",
      description: `Loaded via Public ID: ${customPublicId.trim()}`,
      badge: "Custom Stream",
      initialPublicId: customPublicId.trim(),
    });
    toast.success(`Streaming public ID: ${customPublicId.trim()}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file (MP4, MOV, WebM).");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video file must be under 100MB for trial upload.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(
      "Uploading video to Cloudinary with eager HLS compilation...",
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
      formData.append("category", "commerce_demo");

      const res = await fetch("/api/video/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to compile video");
      }

      toast.success(
        "HLS video compilation complete! Streaming adaptive playlist.",
        {
          id: toastId,
        },
      );

      setActivePublicId(data.video.publicId);
      setSelectedVideo({
        id: data.video.publicId,
        title: data.video.title || file.name,
        category: "commerce_upload",
        description: `Eager HLS stream ready: ${data.video.hlsUrl}`,
        badge: "Live HLS Stream",
        initialPublicId: data.video.publicId,
      });
    } catch (err: any) {
      toast.error(err.message || "Video upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Film className="size-3.5" />
            Adaptive Bitrate Video Engine (Bonus Track)
          </div>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cloudinary HLS Video Streaming
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Demonstrates autonomous video compilation with{" "}
            <code className="text-primary font-mono text-xs">sp_auto</code>{" "}
            streaming profiles, eager HLS playlists (.m3u8), and sub-second
            adaptive bitrate switching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 shadow-sm font-medium"
          >
            <UploadCloud className="size-4" />
            {isUploading ? "Transcoding HLS..." : "Upload & Compile Video"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProductVideoPlayer
            publicId={activePublicId}
            title={selectedVideo.title}
            category={selectedVideo.category}
            cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}
          />

          <Card className="border-border/70 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  Pre-compiled HLS Video Presets
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  3 Presets Available
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Select any verified Cloudinary video asset to test live HLS
                multi-bitrate playback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_VIDEOS.map((sample) => {
                  const isCurrent = activePublicId === sample.initialPublicId;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                        isCurrent
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-card/40 hover:bg-card/80 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium"
                        >
                          {sample.badge}
                        </Badge>
                        {isCurrent && (
                          <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        {sample.title}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                        {sample.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleCustomSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter any Cloudinary public_id (e.g. samples/sea-turtle)"
                  value={customPublicId}
                  onChange={(e) => setCustomPublicId(e.target.value)}
                  className="flex-1 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="text-xs font-medium"
                >
                  Load Stream
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                Adaptive Streaming Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-3">
                <Radio className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    HLS Master Playlist (.m3u8)
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    Cloudinary eagerly transcodes uploads into an HLS
                    multi-variant playlist containing 1080p, 720p, 480p, and
                    360p segments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-3">
                <Layers className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Bandwidth-Aware Switching
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    Client-side{" "}
                    <code className="text-primary font-mono">hls.js</code>{" "}
                    engine continuously measures throughput, switching
                    resolutions mid-playback with zero re-buffering.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-3">
                <ShieldCheck className="size-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Dual Fallback Matrix
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    Safari utilizes native Apple HLS; standard browsers use MSE;
                    unsupported clients automatically gracefully degrade to
                    optimized MP4.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="size-4 text-primary" />
                Cloudinary Transformation URL Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                HLS Playlist URL format generated by Lumina:
              </p>
              <div className="rounded-lg bg-black/80 p-3 font-mono text-[11px] text-emerald-400 break-all leading-relaxed">
                https://res.cloudinary.com/
                <span className="text-amber-400">&lt;cloud_name&gt;</span>
                /video/upload/
                <span className="text-sky-400">sp_auto</span>/{activePublicId}
                .m3u8
              </div>

              <p className="text-xs text-muted-foreground pt-1">
                Poster extraction with auto-optimization:
              </p>
              <div className="rounded-lg bg-black/80 p-3 font-mono text-[11px] text-sky-300 break-all leading-relaxed">
                .../video/upload/
                <span className="text-amber-400">
                  so_auto,f_auto,q_auto,w_1280
                </span>
                /{activePublicId}.jpg
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
