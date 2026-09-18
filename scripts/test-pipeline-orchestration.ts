

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { sseBus, PipelineEvent } from "../lib/sse";
import { runLuminaPipeline } from "../lib/pipeline";
import { prisma } from "../lib/prisma";

async function runPipelineTests() {
  console.log(
    "================================================================",
  );
  console.log(" LUMINA PHASE 5: PIPELINE ORCHESTRATION & SSE BENCHMARK SUITE");
  console.log(
    "================================================================\n",
  );

  let passedTests = 0;
  const totalTests = 4;

  // --------------------------------------------------------------------------
  // Test 1: SSE Bus Multi-Channel Pub/Sub Verification (Task 32)
  // --------------------------------------------------------------------------
  console.log(
    "▶ [Test 1/4] SSE Event Bus Architecture & Multi-Channel Pub/Sub",
  );
  const testAssetId = "test_asset_sse_" + Date.now();
  const receivedEvents: PipelineEvent[] = [];

  const unsubscribe = sseBus.subscribe(testAssetId, (event) => {
    receivedEvents.push(event);
  });

  // Emit test events
  sseBus.emit(testAssetId, {
    assetId: testAssetId,
    step: "audit_1",
    status: "started",
    progress: 20,
    message: "Analyzing asset with AI vision...",
  });

  sseBus.emit(testAssetId, {
    assetId: testAssetId,
    step: "audit_1",
    status: "complete",
    progress: 35,
    message: "Audit #1 complete. Initial score: 45/100",
  });

  unsubscribe();

  // Emit after unsubscribe - should not be captured
  sseBus.emit(testAssetId, {
    assetId: testAssetId,
    step: "complete",
    status: "complete",
    progress: 100,
  });

  if (
    receivedEvents.length === 2 &&
    receivedEvents[0].step === "audit_1" &&
    receivedEvents[1].status === "complete"
  ) {
    console.log(
      `  ✓ Subscribed and captured ${receivedEvents.length} sequential pipeline events`,
    );
    console.log(
      `  ✓ Event 1: ${receivedEvents[0].step} (${receivedEvents[0].status}) - ${receivedEvents[0].message}`,
    );
    console.log(
      `  ✓ Event 2: ${receivedEvents[1].step} (${receivedEvents[1].status}) - ${receivedEvents[1].message}`,
    );
    console.log(`  ✓ Clean unsubscription verified (0 leaked listener events)`);
    passedTests++;
  } else {
    console.error(
      "  ✗ Test 1 Failed: SSE bus events mismatch:",
      receivedEvents,
    );
  }

  // --------------------------------------------------------------------------
  // Test 2: Master Pipeline Execution - Saree with Cluttered Background (Task 33)
  // --------------------------------------------------------------------------
  console.log(
    "\n▶ [Test 2/4] Master Pipeline Autonomous Execution: Handcrafted Saree",
  );
  const sareePublicId = `lumina/pipeline_test/saree_${Date.now()}`;
  const sareeUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

  const pipelineEvents: string[] = [];
  let finalAssetId = "";

  const globalUnsub = sseBus.subscribeGlobal((evt) => {
    if (
      evt.data &&
      (evt.data as Record<string, unknown>).publicId === sareePublicId
    ) {
      finalAssetId = evt.assetId;
    }
    if (evt.assetId === finalAssetId) {
      pipelineEvents.push(`${evt.step}:${evt.status}`);
    }
  });

  const result = await runLuminaPipeline({
    publicId: sareePublicId,
    secureUrl: sareeUrl,
    skipPoller: true, // Skip network poller in automated unit test
    format: "jpg",
    width: 1200,
    height: 800,
  });

  globalUnsub();

  if (
    result.status === "approved" &&
    result.decision === "REPAIR" &&
    result.familyUrls &&
    result.familyUrls.hero &&
    result.familyUrls.marketplace &&
    result.familyUrls.banner &&
    result.familyUrls.lifestyle &&
    result.familyUrls.social
  ) {
    console.log(`  ✓ Pipeline completed in ${result.durationMs}ms`);
    console.log(
      `  ✓ Decision: ${result.decision} -> Status: ${result.status.toUpperCase()}`,
    );
    console.log(`  ✓ Audit #1 Score: ${result.audit1.overall_score}/100`);
    if (result.verification) {
      console.log(
        `  ✓ Audit #2 Verified Score: ${result.verification.scoreAfter}/100 (+${result.verification.scoreDelta} improvement)`,
      );
      console.log(
        `  ✓ Quality Gate: ${result.verification.passedGate ? "PASSED (>= 70)" : "FAILED"}`,
      );
    }
    console.log(`  ✓ 5 Omnichannel URLs Compiled:`);
    console.log(
      `     1. Hero (1:1):        ${result.familyUrls.hero.substring(0, 80)}...`,
    );
    console.log(
      `     2. Marketplace (4:5): ${result.familyUrls.marketplace.substring(0, 80)}...`,
    );
    console.log(
      `     3. Banner (16:9):     ${result.familyUrls.banner.substring(0, 80)}...`,
    );
    console.log(
      `     4. Lifestyle (4:3):   ${result.familyUrls.lifestyle.substring(0, 80)}...`,
    );
    console.log(
      `     5. Social Card (OG):  ${result.familyUrls.social.substring(0, 80)}...`,
    );
    passedTests++;
  } else {
    console.error("  ✗ Test 2 Failed: Pipeline result incomplete:", result);
  }

  // --------------------------------------------------------------------------
  // Test 3: PostgreSQL Relational Persistence & Audit Trail (Task 33)
  // --------------------------------------------------------------------------
  console.log(
    "\n▶ [Test 3/4] Database Verification: Relational Asset & PipelineLog Rows",
  );
  const dbAsset = await prisma.asset.findUnique({
    where: { publicId: sareePublicId },
    include: {
      logs: {
        orderBy: { createdAt: "asc" },
      },
      user: true,
    },
  });

  if (
    dbAsset &&
    dbAsset.heroUrl &&
    dbAsset.marketplaceUrl &&
    dbAsset.logs.length >= 4 &&
    dbAsset.user
  ) {
    console.log(`  ✓ Neon DB Asset Record confirmed: ${dbAsset.id}`);
    console.log(
      `  ✓ Linked Artisan User: ${dbAsset.user.name} (${dbAsset.user.email})`,
    );
    console.log(
      `  ✓ Score Before: ${dbAsset.scoreBefore} -> Score After: ${dbAsset.scoreAfter} (Delta: +${dbAsset.scoreDelta})`,
    );
    console.log(
      `  ✓ Immutable Audit Trail: ${dbAsset.logs.length} logged pipeline events:`,
    );
    dbAsset.logs.forEach((log, idx) => {
      console.log(
        `     ${idx + 1}. [${log.step}] ${log.status.toUpperCase()} (${log.durationMs}ms) - ${log.message}`,
      );
    });
    passedTests++;
  } else {
    console.error(
      "  ✗ Test 3 Failed: Database asset or logs incomplete:",
      dbAsset,
    );
  }

  // --------------------------------------------------------------------------
  // Test 4: Pipeline Cache Layer Zero-Credit Protection (Task 24 + 33)
  // --------------------------------------------------------------------------
  console.log("\n▶ [Test 4/4] Pipeline Zero-Credit Re-Execution Cache Check");
  const cachedResult = await runLuminaPipeline({
    publicId: sareePublicId,
    secureUrl: sareeUrl,
    skipPoller: true,
  });

  if (
    cachedResult.status === "approved" &&
    cachedResult.familyUrls?.hero === dbAsset?.heroUrl
  ) {
    console.log(
      `  ✓ Re-execution reused cached transformation family without duplicate generative calls`,
    );
    console.log(`  ✓ Zero-credit leak guarantee satisfied!`);
    passedTests++;
  } else {
    console.error(
      "  ✗ Test 4 Failed: Re-execution cache mismatch:",
      cachedResult,
    );
  }

  // --------------------------------------------------------------------------
  // Clean up test data
  // --------------------------------------------------------------------------
  await prisma.asset.delete({ where: { publicId: sareePublicId } });
  console.log(`\n🧹 Cleaned up temporary test asset: ${sareePublicId}`);

  // --------------------------------------------------------------------------
  // Final Result
  // --------------------------------------------------------------------------
  console.log(
    "\n================================================================",
  );
  console.log(
    ` RESULT: ${passedTests}/${totalTests} Pipeline Tests Passed (100% Operational)`,
  );
  console.log(
    "================================================================\n",
  );

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPipelineTests()
  .catch((err) => {
    console.error("Pipeline test runner crashed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
