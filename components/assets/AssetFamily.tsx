/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Maximize2,
  Share2,
  Palette,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AssetFamilyUrls } from "@/types/audit";

export interface AssetFamilyProps {
  familyUrls: AssetFamilyUrls;
  title?: string;
  category?: string;
  className?: string;
}

interface VariantCardDef {
  key: keyof AssetFamilyUrls;
  title: string;
  channel: string;
  aspectRatioLabel: string;
  dimensions: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  aspectClass: string;
}

const VARIANTS: VariantCardDef[] = [
  {
    key: "hero",
    title: "1. Primary Hero Shot",
    channel: "Amazon / Shopify / Etsy",
    aspectRatioLabel: "1:1 Square",
    dimensions: "1080 × 1080",
    icon: ShoppingBag,
    description: "Centering with soft shadow & white studio pad",
    aspectClass: "aspect-square",
  },
  {
    key: "marketplace",
    title: "2. Mobile Feed Card",
    channel: "Flipkart / Myntra / Instagram",
    aspectRatioLabel: "4:5 Portrait",
    dimensions: "800 × 1000",
    icon: Smartphone,
    description: "Generative outpainting for mobile commerce feeds",
    aspectClass: "aspect-[4/5]",
  },
  {
    key: "banner",
    title: "3. Editorial Billboard",
    channel: "Website Hero Banner",
    aspectRatioLabel: "16:9 Cinematic",
    dimensions: "1920 × 1080",
    icon: Maximize2,
    description: "AI outpainting fills flanks without stretching subject",
    aspectClass: "aspect-video",
  },
  {
    key: "lifestyle",
    title: "4. Contextual Lifestyle",
    channel: "Lookbook / Marketing",
    aspectRatioLabel: "4:3 In-Situ",
    dimensions: "1200 × 900",
    icon: Palette,
    description: "Warm boutique ambient setting with soft sunlight bokeh",
    aspectClass: "aspect-[4/3]",
  },
  {
    key: "social",
    title: "5. Social Share Card",
    channel: "Open Graph / WhatsApp / X",
    aspectRatioLabel: "1.91:1 Social OG",
    dimensions: "1200 × 630",
    icon: Share2,
    description: "Dynamic typography overlays and verified score badge",
    aspectClass: "aspect-[1200/630]",
  },
];

export function AssetFamily({
  familyUrls,
  title = "Artisan Catalog Asset",
  category = "Handcrafted",
  className = "",
}: AssetFamilyProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success("Cloudinary delivery URL copied to clipboard!");
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Omnichannel Commerce Asset Family
            </h3>
            <Badge className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
              5 Production Variants
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compiled autonomously from a single smartphone capture via
            Cloudinary Dynamic URL Architecture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
          >
            <Sparkles className="mr-1 size-3" />
            <span>f_auto,q_auto Active</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {VARIANTS.map((variant) => {
          const url = familyUrls[variant.key];
          const Icon = variant.icon;
          const isCopied = copiedKey === variant.key;

          if (!url) return null;

          return (
            <Card
              key={variant.key}
              className="group overflow-hidden border-border/70 bg-card/70 shadow-md backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
            >
              <div
                className={`relative w-full overflow-hidden bg-muted/30 border-b border-border/50 ${variant.aspectClass}`}
              >
                <img
                  src={url}
                  alt={`${title} - ${variant.title}`}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute top-3 left-3">
                  <Badge
                    variant="secondary"
                    className="border border-border/80 bg-background/85 px-2 py-0.5 text-[10px] font-bold backdrop-blur-md shadow-xs"
                  >
                    {variant.aspectRatioLabel}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3">
                  <Badge
                    variant="secondary"
                    className="border border-border/80 bg-background/85 px-2 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur-md shadow-xs"
                  >
                    {variant.dimensions}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Icon className="size-3.5 text-primary" />
                    <span>{variant.title}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-primary mt-0.5">
                    {variant.channel}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                    {variant.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs font-medium"
                    onClick={() => handleCopy(variant.key, url)}
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy CDN URL</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Open full resolution in Cloudinary"
                      className="border border-border/60 hover:bg-accent"
                    >
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
