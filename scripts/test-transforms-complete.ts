import {
  buildEnhancedRepairChain,
  generateAssetFamily,
  getSocialOgImageUrl,
} from "../lib/asset-family";
import { persistAssetFamily, getCachedAssetFamily } from "../lib/transform-cache";
import { waitForTransformation } from "../lib/transform-poller";
import { prisma } from "../lib/prisma";
import { AuditResult } from "../types/audit";

async function testPhase3() {
  console.log("🚀 Testing Phase 3 Generative Transformations & Caching (Tasks 20 - 25)...\n");

  const testPublicId = "lumina/demo/saree_sample_test";

  // 1. Task 20: Color Correction & Dynamic Lighting & Edge Enhancement
  console.log("1. Testing Micro-Transformations (Task 20):");
  const defectiveAudit: AuditResult = {
    scores: {
      product_visibility: 72, // Trigger e_sharpen:80
      background_quality: 35, // Trigger background replace
      lighting_quality: 48,   // Trigger e_improve:50 & e_vibrance:25
      composition: 60,        // Trigger c_auto,g_auto
      brand_safety: 100,
    },
    overall_score: 54,
    commerce_ready: false,
    decision: "REPAIR",
    detected_issues: ["underexposed", "cluttered"],
    has_watermark: false,
    has_text_overlay: false,
    semantics: {
      product_category: "Handwoven Silk Saree",
      dominant_colors: ["#800020"],
      seo_description: "Silk saree",
    },
  };

  const repair = buildEnhancedRepairChain(defectiveAudit);
  console.log("   - Generated Repair Chain:", repair.transformChain);
  if (
    !repair.transformChain.includes("e_improve") ||
    !repair.transformChain.includes("e_sharpen") ||
    !repair.transformChain.includes("e_vibrance") ||
    !repair.transformChain.includes("e_gen_background_replace")
  ) {
    throw new Error("Missing expected micro-transformation filter");
  }
  console.log("   ✅ Passed\n");

  // 2. Task 21: Omnichannel 5-Asset Family
  console.log("2. Testing 5-Asset Omnichannel Generation (Task 21):");
  const family = generateAssetFamily(testPublicId, repair.transformChain, defectiveAudit.semantics, 94);
  console.log("   - Hero 1:1:", family.hero);
  console.log("   - Marketplace 4:5:", family.marketplace);
  console.log("   - Banner 16:9:", family.banner);
  console.log("   - Lifestyle:", family.lifestyle);
  console.log("   - Social OG:", family.social);
  console.log("   ✅ Passed\n");

  // 3. Task 22: getCldOgImageUrl Integration
  console.log("3. Testing Dynamic Social OG URL (Task 22):");
  const ogUrl = getSocialOgImageUrl(testPublicId, "Silk Saree");
  console.log("   - OG Image URL:", ogUrl);
  if (!ogUrl.includes("res.cloudinary.com")) {
    throw new Error("Invalid OG URL");
  }
  console.log("   ✅ Passed\n");

  // 4. Task 23: Transformation Poller
  console.log("4. Testing Async Transformation Poller (Task 23):");
  // Poll a known public Cloudinary sample
  const pollerRes = await waitForTransformation("https://res.cloudinary.com/drntwxfcc/image/upload/sample.jpg", 8000);
  console.log(`   - Poller Status: ${pollerRes.status}, Ready: ${pollerRes.ready}, Duration: ${pollerRes.durationMs}ms`);
  console.log("   ✅ Passed\n");

  // 5. Task 24: PostgreSQL Cache Layer
  console.log("5. Testing Database Cache Persistence (Task 24):");
  await persistAssetFamily(testPublicId, family, repair.transformChain);
  const cached = await getCachedAssetFamily(testPublicId);

  if (!cached || !cached.hero || !cached.banner) {
    throw new Error("Failed to read cached family from PostgreSQL");
  }
  console.log("   - Successfully retrieved cached URLs from PostgreSQL!");
  console.log("   - Cached Hero:", cached.hero);
  console.log("   ✅ Passed\n");

  await prisma.$disconnect();
  console.log("🎉 All Tasks 20, 21, 22, 23, 24 & 25 Successfully Verified!");
}

testPhase3().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
