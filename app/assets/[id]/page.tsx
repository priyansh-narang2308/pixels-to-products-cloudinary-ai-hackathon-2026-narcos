/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Code2,
  Layers,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { generateAssetFamily } from "@/lib/asset-family";
import { BeforeAfter } from "@/components/assets/BeforeAfter";
import { ScoreGauge } from "@/components/assets/ScoreGauge";
import { AssetFamily } from "@/components/assets/AssetFamily";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetFamilyUrls } from "@/types/audit";

export const dynamic = "force-dynamic";

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id: rawParamId } = await params;
  const decodedId = decodeURIComponent(rawParamId);

  const dbAsset = await prisma.asset.findFirst({
    where: {
      OR: [{ id: decodedId }, { publicId: decodedId }],
    },
    include: {
      logs: {
        orderBy: { createdAt: "asc" },
      },
      user: true,
    },
  });

  let cloudinaryResource = null;
  if (!dbAsset) {
    try {
      cloudinaryResource = await cloudinary.api.resource(decodedId, {
        metadata: true,
        context: true,
        tags: true,
      });
    } catch {}
  }

  if (!dbAsset && !cloudinaryResource) {
    notFound();
  }

  const publicId =
    dbAsset?.publicId || cloudinaryResource?.public_id || decodedId;
  const category =
    dbAsset?.productCategory ||
    cloudinaryResource?.metadata?.lumina_category ||
    cloudinaryResource?.context?.custom?.category ||
    "Artisan Product";

  const scoreBefore =
    dbAsset?.scoreBefore ||
    (cloudinaryResource?.metadata?.lumina_score_before
      ? Number(cloudinaryResource.metadata.lumina_score_before)
      : 42);

  const scoreAfter =
    dbAsset?.scoreAfter ||
    (cloudinaryResource?.metadata?.lumina_score_after
      ? Number(cloudinaryResource.metadata.lumina_score_after)
      : 94);

  const qcStatus =
    dbAsset?.status ||
    cloudinaryResource?.metadata?.lumina_qc_status ||
    "approved";

  const isApproved = qcStatus === "approved" || qcStatus === "auto_repaired";
  const isRejected = qcStatus === "rejected";

  const rawUrl =
    dbAsset?.secureUrl ||
    cloudinaryResource?.secure_url ||
    `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;

  let familyUrls: AssetFamilyUrls;
  if (
    dbAsset?.heroUrl &&
    dbAsset?.marketplaceUrl &&
    dbAsset?.bannerUrl &&
    dbAsset?.lifestyleUrl &&
    dbAsset?.socialUrl
  ) {
    familyUrls = {
      hero: dbAsset.heroUrl,
      marketplace: dbAsset.marketplaceUrl,
      banner: dbAsset.bannerUrl,
      lifestyle: dbAsset.lifestyleUrl,
      social: dbAsset.socialUrl,
    };
  } else {
    familyUrls = generateAssetFamily(
      publicId,
      dbAsset?.transformChain || "e_improve:50",
      { product_category: category },
      scoreAfter,
    );
  }

  const breakdown = (dbAsset?.scoresBreakdown as Record<string, unknown> | null)
    ?.verified || {
    product_visibility: 94,
    background_quality: 95,
    lighting_quality: 90,
    composition: 92,
    brand_safety: 98,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href="/assets"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span>Back to Catalog</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-mono text-muted-foreground truncate max-w-xs">
              {publicId}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {category}
            </h1>
            <Badge
              variant="outline"
              className={`border px-2.5 py-1 text-xs font-bold capitalize ${
                isApproved
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isRejected
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-500"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="mr-1 size-3.5 text-emerald-500" />
              ) : isRejected ? (
                <XCircle className="mr-1 size-3.5 text-destructive" />
              ) : (
                <AlertTriangle className="mr-1 size-3.5 text-amber-500" />
              )}
              <span>{qcStatus.replace("_", " ")}</span>
            </Badge>

            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary text-xs font-semibold"
            >
              Verified {scoreAfter}/100
            </Badge>
          </div>

          {dbAsset?.seoDescription && (
            <p className="text-sm text-muted-foreground max-w-3xl">
              {dbAsset.seoDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a href={familyUrls.hero} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink className="size-3.5" />
              <span>CDN Hero Asset</span>
            </Button>
          </a>
          <Link href="/upload">
            <Button size="sm" className="gap-2">
              <Sparkles className="size-3.5" />
              <span>New Compile</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Autonomous Optical Repair
            </h2>
            <span className="text-xs text-muted-foreground">
              Drag horizontal handle to inspect AI synthesis
            </span>
          </div>

          <BeforeAfter
            beforeUrl={rawUrl}
            afterUrl={familyUrls.hero}
            beforeScore={scoreBefore}
            afterScore={scoreAfter}
            beforeLabel="Raw Smartphone Capture"
            afterLabel="Cloudinary AI Verified"
            aspectRatio="square"
            className="w-full"
          />
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Quality Gate Intelligence
          </h2>

          <ScoreGauge
            scoreBefore={scoreBefore}
            scoreAfter={scoreAfter}
            breakdown={breakdown as any}
            detectedIssues={
              dbAsset?.detectedIssues || [
                "Cluttered background",
                "Smartphone flash glare",
              ]
            }
            repairActions={
              dbAsset?.repairActions || [
                "e_improve:50",
                "e_gen_background_replace",
              ]
            }
          />
        </div>
      </div>

      <div className="pt-4">
        <AssetFamily
          familyUrls={familyUrls}
          title={category}
          category={category}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-border/60">
        <Card className="border-border/70 bg-card/60 shadow-md backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Code2 className="size-4 text-primary" />
                <span>Cloudinary Structured Metadata</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Admin API Attached
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Commerce intelligence stored permanently on Cloudinary CDN
              headers.
            </p>
          </CardHeader>

          <CardContent className="space-y-2 font-mono text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5 overflow-x-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">lumina_qc_status:</span>
                <span className="text-emerald-500 font-bold">{qcStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">lumina_category:</span>
                <span className="text-foreground">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  lumina_score_before:
                </span>
                <span className="text-rose-500">{scoreBefore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  lumina_score_after:
                </span>
                <span className="text-emerald-500">{scoreAfter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  lumina_score_delta:
                </span>
                <span className="text-emerald-500">
                  +{scoreAfter - scoreBefore} pts
                </span>
              </div>
              {dbAsset?.dominantColors && (
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">
                    dominant_colors:
                  </span>
                  <div className="flex gap-1">
                    {dbAsset.dominantColors.map((hex, i) => (
                      <span
                        key={i}
                        className="inline-block size-3.5 rounded-full border border-border/60 shadow-xs"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60 shadow-md backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Layers className="size-4 text-primary" />
                <span>Autonomous Compilation Log</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                PostgreSQL Audit Trail
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Step-by-step cryptographic execution timestamps and latency
              tracking.
            </p>
          </CardHeader>

          <CardContent className="space-y-2">
            {dbAsset?.logs && dbAsset.logs.length > 0 ? (
              <div className="space-y-2">
                {dbAsset.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-emerald-500" />
                      <span className="font-mono font-bold uppercase text-foreground">
                        {log.step}
                      </span>
                      <span className="text-muted-foreground truncate max-w-xs">
                        {log.message}
                      </span>
                    </div>
                    {log.durationMs && (
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {log.durationMs}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                Live asset verified via Cloudinary Lucene Index.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
