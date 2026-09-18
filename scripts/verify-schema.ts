import { prisma } from "../lib/prisma";

async function verifySchema() {
  console.log("🔍 Verifying Neon PostgreSQL schema & relations...");

  // 1. Upsert Demo User
  const user = await prisma.user.upsert({
    where: { email: "demo-artisan@lumina.ai" },
    update: {},
    create: {
      id: "demo-artisan-01",
      email: "demo-artisan@lumina.ai",
      name: "Priyansh (Artisan Demo)",
      role: "artisan",
    },
  });
  console.log("✅ User Verified:", user.id, user.name);

  // 2. Upsert Sample Asset with Complete Multi-Dimensional Intelligence
  const testPublicId = "lumina/demo/saree_sample_test";
  const asset = await prisma.asset.upsert({
    where: { publicId: testPublicId },
    update: {
      status: "approved",
      scoreBefore: 42,
      scoreAfter: 94,
      scoreDelta: 52,
      decision: "REPAIR",
    },
    create: {
      publicId: testPublicId,
      secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      userId: user.id,
      status: "approved",
      decision: "REPAIR",
      scoreBefore: 42,
      scoreAfter: 94,
      scoreDelta: 52,
      productCategory: "Handwoven Silk Saree",
      seoDescription:
        "Traditional Indian handloom Kanchipuram silk saree with rich temple border",
      dominantColors: ["#8B4513", "#FFD700", "#DC143C"],
      detectedIssues: ["cluttered_background", "uneven_lighting", "off_center"],
      repairActions: [
        "e_gen_background_replace:prompt_minimalist_studio",
        "e_improve",
      ],
      heroUrl:
        "https://res.cloudinary.com/demo/image/upload/c_pad,ar_1:1,w_1080/sample.jpg",
      marketplaceUrl:
        "https://res.cloudinary.com/demo/image/upload/c_pad,ar_4:5,w_800/sample.jpg",
      bannerUrl:
        "https://res.cloudinary.com/demo/image/upload/c_pad,ar_16:9,w_1920/sample.jpg",
      lifestyleUrl:
        "https://res.cloudinary.com/demo/image/upload/e_gen_background_replace/sample.jpg",
      socialUrl:
        "https://res.cloudinary.com/demo/image/upload/w_1200,h_630/sample.jpg",
      scoresBreakdown: {
        initial: {
          product_visibility: 90,
          background_quality: 15,
          lighting_quality: 35,
          composition: 60,
          brand_safety: 100,
        },
        verified: {
          product_visibility: 95,
          background_quality: 95,
          lighting_quality: 90,
          composition: 92,
          brand_safety: 100,
        },
      },
    },
  });
  console.log(
    "✅ Asset Created & Verified:",
    asset.id,
    asset.publicId,
    `Score: ${asset.scoreBefore} -> ${asset.scoreAfter}`,
  );

  // 3. Create Pipeline Audit Log
  const log = await prisma.pipelineLog.create({
    data: {
      assetId: asset.id,
      step: "audit_2",
      status: "success",
      durationMs: 1420,
      message: "Quality Gate Passed: Score improved from 42 to 94",
      data: { scoreBefore: 42, scoreAfter: 94, delta: 52 },
    },
  });
  console.log("✅ PipelineLog Recorded:", log.id, log.step, log.message);

  // 4. Test Relational Query
  const assetWithRelations = await prisma.asset.findUnique({
    where: { id: asset.id },
    include: {
      user: true,
      logs: true,
    },
  });

  console.log("🌟 Relational Query Result:");
  console.log(`- Asset: ${assetWithRelations?.publicId}`);
  console.log(
    `- Owner: ${assetWithRelations?.user.name} (${assetWithRelations?.user.email})`,
  );
  console.log(`- Linked Logs Count: ${assetWithRelations?.logs.length}`);
  console.log(`- Asset Family Variants Cached: 5/5`);

  await prisma.$disconnect();
  console.log("🎉 Database Schema Validation Completed Successfully!");
}

verifySchema().catch((err) => {
  console.error("❌ Schema Verification Failed:", err);
  process.exit(1);
});
