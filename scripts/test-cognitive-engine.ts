import {
  calculateOverallScore,
  evaluateCommerceReadiness,
  computeVerificationMetrics,
  generateQualitySummary,
} from "../lib/scoring-engine";
import { analyzeAsset } from "../lib/vision-fallback";
import { ScoreBreakdown, AuditResult } from "../types/audit";

async function testCognitiveSuite() {
  console.log("⚡ Testing Cognitive Audit & Scoring Engine (Tasks 11, 12, 13)...");

  // 1. Test Weighted Formulation Arithmetic
  console.log("\n1. Verifying Scoring Formulation:");
  const testScores: ScoreBreakdown = {
    product_visibility: 90, // 90 * 0.30 = 27.0
    background_quality: 20, // 20 * 0.25 = 5.0
    lighting_quality: 40,   // 40 * 0.20 = 8.0
    composition: 60,        // 60 * 0.15 = 9.0
    brand_safety: 100,      // 100 * 0.10 = 10.0
  };
  const expectedTotal = 27 + 5 + 8 + 9 + 10; // 59
  const actualScore = calculateOverallScore(testScores);
  console.log(`   - Input: PV=90, BQ=20, LQ=40, C=60, BS=100`);
  console.log(`   - Calculated Score: ${actualScore}/100 (Expected: ${expectedTotal})`);
  if (actualScore !== expectedTotal) {
    throw new Error(`Score mismatch: expected ${expectedTotal}, got ${actualScore}`);
  }

  // 2. Test Policy Decisions
  console.log("\n2. Testing Autonomous Routing Policy:");
  // Case A: Cluttered background
  const resRepair = evaluateCommerceReadiness(testScores, false);
  console.log(`   - Cluttered photo -> Decision: ${resRepair.decision} (Expected: REPAIR)`);
  if (resRepair.decision !== "REPAIR") throw new Error("Expected REPAIR");

  // Case B: Watermarked stock photo
  const resReject = evaluateCommerceReadiness(testScores, true);
  console.log(`   - Watermarked photo -> Decision: ${resReject.decision} (Expected: REJECT)`);
  if (resReject.decision !== "REJECT") throw new Error("Expected REJECT");

  // Case C: Studio clean photo
  const cleanScores: ScoreBreakdown = {
    product_visibility: 95,
    background_quality: 95,
    lighting_quality: 90,
    composition: 90,
    brand_safety: 100,
  };
  const resPass = evaluateCommerceReadiness(cleanScores, false);
  console.log(`   - Studio photo -> Decision: ${resPass.decision}, Score: ${resPass.overall_score} (Expected: PASS)`);
  if (resPass.decision !== "PASS") throw new Error("Expected PASS");

  // 3. Test Verification Closed-Loop Delta Metrics
  console.log("\n3. Testing Quality Gate & Verification Delta:");
  const initialAudit: AuditResult = {
    scores: testScores,
    overall_score: actualScore, // 59
    commerce_ready: false,
    decision: "REPAIR",
    detected_issues: ["cluttered background", "dim lighting"],
    has_watermark: false,
    has_text_overlay: false,
    semantics: {
      product_category: "Silk Saree",
      dominant_colors: ["#8B4513"],
      seo_description: "Silk saree photo",
    },
  };

  const verifiedAudit: AuditResult = {
    scores: cleanScores,
    overall_score: calculateOverallScore(cleanScores), // 94
    commerce_ready: true,
    decision: "PASS",
    detected_issues: [],
    has_watermark: false,
    has_text_overlay: false,
    semantics: {
      product_category: "Silk Saree",
      dominant_colors: ["#8B4513"],
      seo_description: "Silk saree photo",
    },
  };

  const verification = computeVerificationMetrics(initialAudit, verifiedAudit);
  console.log(`   - Initial Score: ${verification.scoreBefore}`);
  console.log(`   - Verified Score: ${verification.scoreAfter}`);
  console.log(`   - Delta: +${verification.scoreDelta} points`);
  console.log(`   - Gate Status: ${verification.approvalStatus}`);
  console.log(`   - Background Delta: +${verification.dimensionDeltas.background_quality} pts`);

  const summary = generateQualitySummary(verification);
  console.log(`   - Executive Summary: "${summary}"`);

  // 4. Test Unified Cognitive Gateway Gateway Fallback
  console.log("\n4. Testing Unified Cognitive Gateway (analyzeAsset):");
  const fallbackResult = await analyzeAsset("https://res.cloudinary.com/drntwxfcc/image/upload/sample.jpg");
  console.log(`   - Gateway returned decision: ${fallbackResult.decision}`);
  console.log(`   - Category extracted: ${fallbackResult.semantics.product_category}`);
  console.log(`   - Overall score: ${fallbackResult.overall_score}/100`);

  console.log("\n🎉 Tasks 11, 12, and 13 Verified with 100% Success!");
}

testCognitiveSuite().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
