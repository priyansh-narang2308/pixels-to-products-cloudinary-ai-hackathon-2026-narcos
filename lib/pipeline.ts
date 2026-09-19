

import { prisma } from "@/lib/prisma";
import { sseBus } from "@/lib/sse";
import { analyzeAsset } from "@/lib/vision-fallback";
import { determineTransformations, DecisionPlan } from "@/lib/decision-engine";
import { generateAssetFamily, buildRepairedImageUrl } from "@/lib/asset-family";
import { waitForTransformation } from "@/lib/transform-poller";
import {
  persistAssetFamily,
  getCachedAssetFamily,
} from "@/lib/transform-cache";
import {
  verifyRepairedAsset,
  buildFallbackStudioRepair,
} from "@/lib/verification-engine";
import {
  AuditResult,
  VerificationResult,
  AssetFamilyUrls,
} from "@/types/audit";
import { attachLuminaMetadata } from "@/lib/cloudinary-metadata";
import { invalidateCatalogCache } from "@/lib/cache-invalidation";

export interface PipelineOptions {
  publicId: string;
  secureUrl: string;
  assetId?: string;
  userId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  resourceType?: string;
  skipPoller?: boolean;
}

export interface PipelineResult {
  assetId: string;
  publicId: string;
  status: "approved" | "rejected" | "pending";
  decision: "PASS" | "REPAIR" | "REJECT";
  audit1: AuditResult;
  verification?: VerificationResult;
  familyUrls?: AssetFamilyUrls;
  repairedHeroUrl?: string;
  rejectionReason?: string | null;
  durationMs: number;
}

async function getOrCreateArtisan(userId?: string): Promise<string> {
  if (userId) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) return existing.id;
  }

  const defaultArtisan = await prisma.user.upsert({
    where: { email: "demo-artisan@lumina.ai" },
    update: {},
    create: {
      id: "demo-artisan-01",
      email: "demo-artisan@lumina.ai",
      name: "Artisan Merchant",
      role: "artisan",
    },
  });

  return defaultArtisan.id;
}

export async function runLuminaPipeline(
  options: PipelineOptions,
): Promise<PipelineResult> {
  const pipelineStartTime = Date.now();
  const { publicId, secureUrl } = options;

  console.log(`[Lumina Pipeline] 🚀 Starting pipeline for asset: ${publicId}`);

  const cachedFamily = await getCachedAssetFamily(publicId);
  const existingAsset = await prisma.asset.findUnique({
    where: { publicId },
  });

  if (cachedFamily && existingAsset && existingAsset.status === "approved") {
    console.log(
      `[Lumina Pipeline] ⚡ Cache HIT: Returning pre-compiled asset family for ${publicId} (0 API credits used)`,
    );
    sseBus.emit(existingAsset.id, {
      assetId: existingAsset.id,
      step: "complete",
      status: "complete",
      progress: 100,
      message: "Asset retrieved instantly from zero-credit PostgreSQL cache.",
      data: { familyUrls: cachedFamily, score: existingAsset.scoreAfter },
    });

    const breakdown = existingAsset.scoresBreakdown as Record<
      string,
      unknown
    > | null;
    const initialScores = (breakdown?.initial as any) || {
      product_visibility: 95,
      background_quality: 95,
      lighting_quality: 95,
      composition: 95,
      brand_safety: 100,
    };

    return {
      assetId: existingAsset.id,
      publicId,
      status: "approved",
      decision:
        (existingAsset.decision as "PASS" | "REPAIR" | "REJECT") || "PASS",
      audit1: {
        scores: initialScores,
        overall_score: existingAsset.scoreBefore || 94,
        commerce_ready: true,
        decision: "PASS",
        detected_issues: existingAsset.detectedIssues,
        has_watermark: false,
        has_text_overlay: false,
        semantics: {
          product_category: existingAsset.productCategory || "Artisan Product",
          dominant_colors: existingAsset.dominantColors,
          seo_description: existingAsset.seoDescription || "",
        },
      },
      familyUrls: cachedFamily,
      repairedHeroUrl: cachedFamily.hero,
      durationMs: Date.now() - pipelineStartTime,
    };
  }

  const artisanId = await getOrCreateArtisan(options.userId);

  const asset = await prisma.asset.upsert({
    where: { publicId },
    update: {
      status: "analyzing",
      updatedAt: new Date(),
    },
    create: {
      publicId,
      secureUrl,
      userId: artisanId,
      status: "analyzing",
      resourceType: options.resourceType || "image",
      format: options.format || "jpg",
      width: options.width,
      height: options.height,
      bytes: options.bytes,
    },
  });

  const assetId = asset.id;

  sseBus.emit(assetId, {
    assetId,
    step: "upload",
    status: "complete",
    progress: 10,
    message: "Asset ingested and registered in autonomous pipeline.",
    data: { publicId, secureUrl },
  });

  await prisma.pipelineLog.create({
    data: {
      assetId,
      step: "upload",
      status: "success",
      durationMs: Date.now() - pipelineStartTime,
      message: `Asset registered: ${publicId}`,
    },
  });

  const audit1Start = Date.now();
  sseBus.emit(assetId, {
    assetId,
    step: "audit_1",
    status: "started",
    progress: 20,
    message: "Running AI visual audit on raw artisan photograph...",
  });

  const audit1 = await analyzeAsset(secureUrl);
  const audit1Duration = Date.now() - audit1Start;

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      scoreBefore: audit1.overall_score,
      detectedIssues: audit1.detected_issues,
      productCategory: audit1.semantics.product_category,
      seoDescription: audit1.semantics.seo_description,
      dominantColors: audit1.semantics.dominant_colors,
      scoresBreakdown: JSON.parse(JSON.stringify({ initial: audit1.scores })),
      status: "analyzing",
    },
  });

  await prisma.pipelineLog.create({
    data: {
      assetId,
      step: "audit_1",
      status: "success",
      durationMs: audit1Duration,
      message: `Audit #1 complete. Initial Score: ${audit1.overall_score}/100`,
      data: JSON.parse(JSON.stringify({ audit1 })),
    },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "audit_1",
    status: "complete",
    progress: 35,
    message: `Audit #1 complete. Initial Score: ${audit1.overall_score}/100`,
    data: { audit1 },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "decision",
    status: "started",
    progress: 40,
    message: "Evaluating commerce quality gate and copyright compliance...",
  });

  const decisionPlan: DecisionPlan = determineTransformations(audit1);

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      decision: decisionPlan.decision,
      repairActions: decisionPlan.transforms,
      transformChain: decisionPlan.transformChain,
    },
  });

  if (decisionPlan.decision === "REJECT") {
    console.log(
      `[Lumina Pipeline] 🛑 Asset REJECTED: ${decisionPlan.advisoryNote}`,
    );

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: "rejected",
        rejectionReason: decisionPlan.advisoryNote,
      },
    });

    await prisma.pipelineLog.create({
      data: {
        assetId,
        step: "decision",
        status: "failed",
        durationMs: 50,
        message: decisionPlan.advisoryNote,
      },
    });

    sseBus.emit(assetId, {
      assetId,
      step: "decision",
      status: "failed",
      progress: 100,
      message: decisionPlan.advisoryNote,
      data: { decisionPlan },
    });

    attachLuminaMetadata(publicId, {
      qcStatus: "rejected",
      scoreBefore: audit1.overall_score,
      category: audit1.semantics?.product_category,
      seoDesc: decisionPlan.advisoryNote,
    }).catch(() => {});
    invalidateCatalogCache(publicId);

    return {
      assetId,
      publicId,
      status: "rejected",
      decision: "REJECT",
      audit1,
      rejectionReason: decisionPlan.advisoryNote,
      durationMs: Date.now() - pipelineStartTime,
    };
  }

  if (decisionPlan.decision === "PASS") {
    console.log(`[Lumina Pipeline] ✨ Asset PASSED without repairs needed.`);

    let familyUrls = await getCachedAssetFamily(publicId);
    if (!familyUrls) {
      familyUrls = generateAssetFamily(
        publicId,
        "",
        audit1.semantics,
        audit1.overall_score,
      );
      await persistAssetFamily(publicId, familyUrls, "");
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: "approved",
        scoreAfter: audit1.overall_score,
        scoreDelta: 0,
      },
    });

    sseBus.emit(assetId, {
      assetId,
      step: "compile",
      status: "complete",
      progress: 90,
      message: "Omnichannel asset family generated.",
      data: { familyUrls },
    });

    sseBus.emit(assetId, {
      assetId,
      step: "complete",
      status: "complete",
      progress: 100,
      message: "Asset approved! Top-tier commerce quality verified.",
      data: { familyUrls, score: audit1.overall_score },
    });

    attachLuminaMetadata(publicId, {
      qcStatus: "approved",
      category: audit1.semantics?.product_category,
      scoreBefore: audit1.overall_score,
      scoreAfter: audit1.overall_score,
      seoDesc: audit1.semantics?.seo_description,
      dominantColors: audit1.semantics?.dominant_colors,
    }).catch(() => {});
    invalidateCatalogCache(publicId);

    return {
      assetId,
      publicId,
      status: "approved",
      decision: "PASS",
      audit1,
      familyUrls,
      durationMs: Date.now() - pipelineStartTime,
    };
  }

  console.log(`[Lumina Pipeline] 🛠️ Asset scheduled for AI REPAIR...`);
  sseBus.emit(assetId, {
    assetId,
    step: "transform",
    status: "started",
    progress: 50,
    message:
      "Synthesizing contextual studio background and optical enhancements...",
  });

  const transformStart = Date.now();
  const repairedImageUrl = buildRepairedImageUrl(
    publicId,
    decisionPlan.transformChain,
    audit1.semantics.product_category,
  );

  if (!options.skipPoller) {
    const pollResult = await waitForTransformation(repairedImageUrl, 25000);
    console.log(
      `[Lumina Pipeline] Transform Poller resolved in ${pollResult.durationMs}ms (Ready: ${pollResult.ready})`,
    );
  }

  const transformDuration = Date.now() - transformStart;

  await prisma.pipelineLog.create({
    data: {
      assetId,
      step: "transform",
      status: "success",
      durationMs: transformDuration,
      message: "Cloudinary AI background and lighting transformation rendered.",
      data: { repairedImageUrl, transformChain: decisionPlan.transformChain },
    },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "transform",
    status: "complete",
    progress: 65,
    message: "Generative studio synthesis rendered by Cloudinary.",
    data: { repairedImageUrl },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "audit_2",
    status: "started",
    progress: 70,
    message: "Executing secondary AI audit against transformed CDN asset...",
  });

  let verification = await verifyRepairedAsset(repairedImageUrl, audit1, {
    assetId,
    passThreshold: 70,
    autoLogToDb: true,
  });

  if (!verification.passedGate) {
    console.log(
      "[Lumina Pipeline] ⚠️ Primary repair below 70 threshold. Testing fallback studio repair...",
    );

    const fallback = buildFallbackStudioRepair(publicId);
    const fallbackVerification = await verifyRepairedAsset(
      fallback.fallbackUrl,
      audit1,
      {
        assetId,
        passThreshold: 70,
        autoLogToDb: false,
      },
    );

    if (fallbackVerification.passedGate) {
      console.log("[Lumina Pipeline] ✅ Studio fallback passed quality gate!");
      verification = fallbackVerification;
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: "approved",
          scoreAfter: verification.scoreAfter,
          scoreDelta: verification.scoreDelta,
          transformChain: fallback.fallbackTransform,
        },
      });
    } else {

      console.log(
        "[Lumina Pipeline] ❌ Repair insufficient after fallback attempt.",
      );
      sseBus.emit(assetId, {
        assetId,
        step: "audit_2",
        status: "failed",
        progress: 100,
        message: `Post-repair score (${verification.scoreAfter}) failed the quality gate threshold (70).`,
        data: { verification },
      });

      return {
        assetId,
        publicId,
        status: "rejected",
        decision: "REPAIR",
        audit1,
        verification,
        repairedHeroUrl: repairedImageUrl,
        rejectionReason: `Post-repair score of ${verification.scoreAfter} is below minimum marketplace threshold (70).`,
        durationMs: Date.now() - pipelineStartTime,
      };
    }
  }

  sseBus.emit(assetId, {
    assetId,
    step: "audit_2",
    status: "complete",
    progress: 85,
    message: `Verification approved! Score improved from ${verification.scoreBefore} to ${verification.scoreAfter} (+${verification.scoreDelta} pts).`,
    data: { verification },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "compile",
    status: "started",
    progress: 90,
    message: "Compiling 5-variant omnichannel asset family...",
  });

  const compileStart = Date.now();
  const familyUrls = generateAssetFamily(
    publicId,
    decisionPlan.transformChain,
    audit1.semantics,
    verification.scoreAfter,
  );

  await persistAssetFamily(publicId, familyUrls, decisionPlan.transformChain);

  const compileDuration = Date.now() - compileStart;

  await prisma.pipelineLog.create({
    data: {
      assetId,
      step: "compile",
      status: "success",
      durationMs: compileDuration,
      message: "Generated 5-variant omnichannel asset family.",
      data: JSON.parse(JSON.stringify({ familyUrls })),
    },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "compile",
    status: "complete",
    progress: 95,
    message: "Omnichannel asset family generated.",
    data: { familyUrls },
  });

  await attachLuminaMetadata(publicId, {
    qcStatus: "auto_repaired",
    category: audit1.semantics.product_category,
    scoreBefore: audit1.overall_score,
    scoreAfter: verification.scoreAfter,
    seoDesc: audit1.semantics.seo_description,
    dominantColors: audit1.semantics.dominant_colors,
    repairActions: decisionPlan.transforms,
  });

  invalidateCatalogCache(publicId);

  const totalDuration = Date.now() - pipelineStartTime;

  await prisma.pipelineLog.create({
    data: {
      assetId,
      step: "complete",
      status: "success",
      durationMs: totalDuration,
      message: `Autonomous pipeline completed in ${(totalDuration / 1000).toFixed(1)}s`,
    },
  });

  sseBus.emit(assetId, {
    assetId,
    step: "complete",
    status: "complete",
    progress: 100,
    message: `Catalog media compiled and verified ready in ${(totalDuration / 1000).toFixed(1)}s!`,
    data: {
      assetId,
      familyUrls,
      verification,
      repairedHeroUrl: familyUrls.hero,
    },
  });

  console.log(
    `[Lumina Pipeline] 🎉 Pipeline completed successfully for ${publicId} in ${totalDuration}ms`,
  );

  return {
    assetId,
    publicId,
    status: "approved",
    decision: "REPAIR",
    audit1,
    verification,
    familyUrls,
    repairedHeroUrl: familyUrls.hero,
    durationMs: totalDuration,
  };
}
