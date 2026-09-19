import { ScoreBreakdown, AuditDecision, VerificationResult, AuditResult } from "@/types/audit";

export const COMMERCE_WEIGHTS = {
  product_visibility: 0.30,  // Product clarity and focus is most critical
  background_quality: 0.25,  // Clean/isolated background
  lighting_quality: 0.20,    // Balanced studio lighting
  composition: 0.15,         // Proper framing and centering
  brand_safety: 0.10,        // Copyright and watermark protection
} as const;

export function calculateOverallScore(scores: ScoreBreakdown): number {
  const raw =
    scores.product_visibility * COMMERCE_WEIGHTS.product_visibility +
    scores.background_quality * COMMERCE_WEIGHTS.background_quality +
    scores.lighting_quality * COMMERCE_WEIGHTS.lighting_quality +
    scores.composition * COMMERCE_WEIGHTS.composition +
    scores.brand_safety * COMMERCE_WEIGHTS.brand_safety;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function evaluateCommerceReadiness(
  scores: ScoreBreakdown,
  hasWatermark: boolean
): {
  overall_score: number;
  commerce_ready: boolean;
  decision: AuditDecision;
  rejectionReason?: string;
} {
  const overall_score = calculateOverallScore(scores);

  if (hasWatermark || scores.brand_safety < 50) {
    return {
      overall_score,
      commerce_ready: false,
      decision: "REJECT",
      rejectionReason: hasWatermark
        ? "Unauthorized watermark or copyright stamp detected."
        : "Brand safety violation detected.",
    };
  }

  if (
    overall_score >= 80 &&
    scores.background_quality >= 75 &&
    scores.lighting_quality >= 65
  ) {
    return {
      overall_score,
      commerce_ready: true,
      decision: "PASS",
    };
  }

  return {
    overall_score,
    commerce_ready: false,
    decision: "REPAIR",
  };
}

export function computeVerificationMetrics(
  initialAudit: AuditResult,
  verifiedAudit: AuditResult,
  passThreshold = 70
): VerificationResult {
  const scoreBefore = initialAudit.overall_score;
  const scoreAfter = verifiedAudit.overall_score;
  const scoreDelta = scoreAfter - scoreBefore;

  const dimensionDeltas = {
    product_visibility: verifiedAudit.scores.product_visibility - initialAudit.scores.product_visibility,
    background_quality: verifiedAudit.scores.background_quality - initialAudit.scores.background_quality,
    lighting_quality: verifiedAudit.scores.lighting_quality - initialAudit.scores.lighting_quality,
    composition: verifiedAudit.scores.composition - initialAudit.scores.composition,
    brand_safety: verifiedAudit.scores.brand_safety - initialAudit.scores.brand_safety,
  };

  const passedGate = scoreAfter >= passThreshold && !verifiedAudit.has_watermark;

  return {
    initial: initialAudit,
    verified: verifiedAudit,
    scoreBefore,
    scoreAfter,
    scoreDelta,
    passedGate,
    approvalStatus: passedGate ? "approved" : "rejected",
    dimensionDeltas,
  };
}

export function generateQualitySummary(result: VerificationResult): string {
  if (!result.passedGate) {
    return `Quality Gate Failed: Post-repair score of ${result.scoreAfter}/100 is below the ${70} approval threshold.`;
  }

  const highlights: string[] = [];
  if (result.dimensionDeltas.background_quality > 0) {
    highlights.push(`Background quality improved by +${result.dimensionDeltas.background_quality} pts`);
  }
  if (result.dimensionDeltas.lighting_quality > 0) {
    highlights.push(`Lighting enhanced by +${result.dimensionDeltas.lighting_quality} pts`);
  }
  if (result.dimensionDeltas.composition > 0) {
    highlights.push(`Framing improved by +${result.dimensionDeltas.composition} pts`);
  }

  return `Commerce Ready: Score improved from ${result.scoreBefore} to ${result.scoreAfter} (+${result.scoreDelta} pts). ${highlights.join(", ")}.`;
}
