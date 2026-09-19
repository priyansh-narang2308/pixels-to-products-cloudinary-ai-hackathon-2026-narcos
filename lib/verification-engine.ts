import { AuditResult, VerificationResult } from "@/types/audit";
import { analyzeAsset } from "@/lib/vision-fallback";
import {
  computeVerificationMetrics,
  generateQualitySummary,
} from "@/lib/scoring-engine";
import { prisma } from "@/lib/prisma";

export interface VerificationOptions {
  passThreshold?: number;

  assetId?: string;

  autoLogToDb?: boolean;
}

export async function verifyRepairedAsset(
  repairedImageUrl: string,
  initialAudit: AuditResult,
  options: VerificationOptions = {},
): Promise<VerificationResult> {
  const startTime = Date.now();
  const passThreshold = options.passThreshold ?? 70;

  const verifiedAudit = await analyzeAsset(repairedImageUrl);

  const metrics = computeVerificationMetrics(
    initialAudit,
    verifiedAudit,
    passThreshold,
  );

  const durationMs = Date.now() - startTime;
  const summary = generateQualitySummary(metrics);

  const passedGate =
    metrics.scoreAfter >= passThreshold &&
    !verifiedAudit.has_watermark &&
    verifiedAudit.scores.brand_safety >= 50;

  const finalResult: VerificationResult = {
    ...metrics,
    passedGate,
    approvalStatus: passedGate ? "approved" : "rejected",
  };

  if (options.assetId && options.autoLogToDb !== false) {
    try {
      await prisma.pipelineLog.create({
        data: {
          assetId: options.assetId,
          step: "audit_2",
          status: passedGate ? "success" : "failed",
          durationMs,
          message: summary,
          data: JSON.parse(
            JSON.stringify({
              scoreBefore: metrics.scoreBefore,
              scoreAfter: metrics.scoreAfter,
              scoreDelta: metrics.scoreDelta,
              dimensionDeltas: metrics.dimensionDeltas,
              passedGate,
              threshold: passThreshold,
            }),
          ),
        },
      });

      await prisma.asset.update({
        where: { id: options.assetId },
        data: {
          scoreAfter: metrics.scoreAfter,
          scoreDelta: metrics.scoreDelta,
          status: passedGate ? "approved" : "rejected",
          rejectionReason: passedGate
            ? null
            : `Repair insufficient: Post-repair score of ${metrics.scoreAfter} is below threshold ${passThreshold}.`,
          scoresBreakdown: JSON.parse(
            JSON.stringify({
              initial: initialAudit.scores,
              verified: verifiedAudit.scores,
            }),
          ),
        },
      });
    } catch (dbErr) {
      console.error("[Verification Engine DB Error]:", dbErr);
    }
  }

  return finalResult;
}

export function buildFallbackStudioRepair(publicId: string): {
  fallbackUrl: string;
  fallbackTransform: string;
} {
  const fallbackTransform = "c_pad,b_white,ar_1:1,w_1080/e_improve:50";
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drntwxfcc";
  const fallbackUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${fallbackTransform}/f_auto,q_auto/${publicId}`;

  return {
    fallbackUrl,
    fallbackTransform,
  };
}
