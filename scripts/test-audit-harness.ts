import { determineTransformations, resolveCategoryPrompt } from "../lib/decision-engine";
import { AuditResult } from "../types/audit";

interface TestCase {
  name: string;
  audit: AuditResult;
  expectedDecision: "PASS" | "REPAIR" | "REJECT";
  expectedTransformIncludes?: string[];
  expectedTransformsEmpty?: boolean;
}

function runBenchmarkSuite() {
  console.log("🏛️  Running Lumina Cognitive Benchmark Suite (5 Canonical E-Commerce Scenarios)...\n");

  const testCases: TestCase[] = [
    {
      name: "Scenario 1: Saree on Cluttered Bedsheet",
      expectedDecision: "REPAIR",
      expectedTransformIncludes: ["e_gen_background_replace", "e_improve"],
      audit: {
        scores: {
          product_visibility: 85,
          background_quality: 25,
          lighting_quality: 55,
          composition: 70,
          brand_safety: 100,
        },
        overall_score: 55,
        commerce_ready: false,
        decision: "REPAIR",
        detected_issues: ["distracting floral bedsheet background", "dim ambient lighting"],
        has_watermark: false,
        has_text_overlay: false,
        semantics: {
          product_category: "Handwoven Kanchipuram Silk Saree",
          dominant_colors: ["#800020", "#FFD700"],
          seo_description: "Exquisite handwoven silk saree with zari work",
        },
      },
    },
    {
      name: "Scenario 2: Brass Deity Idol in Dim Workshop",
      expectedDecision: "REPAIR",
      expectedTransformIncludes: ["e_improve:50", "e_gen_background_replace"],
      audit: {
        scores: {
          product_visibility: 80,
          background_quality: 40,
          lighting_quality: 35,
          composition: 65,
          brand_safety: 100,
        },
        overall_score: 51,
        commerce_ready: false,
        decision: "REPAIR",
        detected_issues: ["underexposed subject", "workshop background clutter"],
        has_watermark: false,
        has_text_overlay: false,
        semantics: {
          product_category: "Antique Brass Nataraja Idol",
          dominant_colors: ["#B5A642", "#8B5A2B"],
          seo_description: "Solid brass handcrafted deity sculpture",
        },
      },
    },
    {
      name: "Scenario 3: Handcrafted Leather Bag on Studio Backdrop",
      expectedDecision: "PASS",
      expectedTransformsEmpty: true,
      audit: {
        scores: {
          product_visibility: 95,
          background_quality: 90,
          lighting_quality: 88,
          composition: 90,
          brand_safety: 100,
        },
        overall_score: 92,
        commerce_ready: true,
        decision: "PASS",
        detected_issues: [],
        has_watermark: false,
        has_text_overlay: false,
        semantics: {
          product_category: "Full-Grain Leather Tote Bag",
          dominant_colors: ["#4A2E18"],
          seo_description: "Artisanal handcrafted genuine leather tote bag",
        },
      },
    },
    {
      name: "Scenario 4: Stock Photo with Copyright Watermark",
      expectedDecision: "REJECT",
      expectedTransformsEmpty: true,
      audit: {
        scores: {
          product_visibility: 85,
          background_quality: 80,
          lighting_quality: 80,
          composition: 80,
          brand_safety: 20,
        },
        overall_score: 48,
        commerce_ready: false,
        decision: "REJECT",
        detected_issues: ["Shutterstock watermark detected across product"],
        has_watermark: true,
        has_text_overlay: true,
        semantics: {
          product_category: "Luxury Ceramic Dinner Plate",
          dominant_colors: ["#FFFFFF", "#002366"],
          seo_description: "Fine bone china dinnerware",
        },
      },
    },
    {
      name: "Scenario 5: Off-Center Ceramic Mug on Table",
      expectedDecision: "REPAIR",
      expectedTransformIncludes: ["c_auto,g_auto,w_1080,h_1080"],
      audit: {
        scores: {
          product_visibility: 85,
          background_quality: 75,
          lighting_quality: 70,
          composition: 45,
          brand_safety: 100,
        },
        overall_score: 74,
        commerce_ready: false,
        decision: "REPAIR",
        detected_issues: ["subject pushed to left edge with excessive dead space"],
        has_watermark: false,
        has_text_overlay: false,
        semantics: {
          product_category: "Glazed Ceramic Coffee Mug",
          dominant_colors: ["#2B3D4F", "#C8B195"],
          seo_description: "Hand-thrown speckled stoneware coffee mug",
        },
      },
    },
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`Testing: ${tc.name}`);
    const plan = determineTransformations(tc.audit);

    console.log(`  -> Decision: ${plan.decision}`);
    console.log(`  -> Advisory: "${plan.advisoryNote}"`);
    if (plan.transforms.length > 0) {
      console.log(`  -> Transform Chain: ${plan.transformChain}`);
    }

    if (plan.decision !== tc.expectedDecision) {
      throw new Error(`Failed on ${tc.name}: expected decision ${tc.expectedDecision}, got ${plan.decision}`);
    }

    if (tc.expectedTransformsEmpty && plan.transforms.length > 0) {
      throw new Error(`Failed on ${tc.name}: expected empty transforms, got ${plan.transforms.length}`);
    }

    if (tc.expectedTransformIncludes) {
      for (const expected of tc.expectedTransformIncludes) {
        const found = plan.transforms.some((t) => t.includes(expected));
        if (!found) {
          throw new Error(`Failed on ${tc.name}: expected transform to include "${expected}", but got: ${plan.transformChain}`);
        }
      }
    }

    console.log("  ✅ Passed\n");
    passed++;
  }

  console.log(`🎉 Benchmark Suite Passed: ${passed}/${testCases.length} Canonical Scenarios Verified!`);
}

runBenchmarkSuite();
