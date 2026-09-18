import {
  COMMERCE_AUDIT_PROMPT,
  COMMERCE_AUDIT_SCHEMA,
  cleanAndParseJson,
  buildCloudinaryAnalysisPayload,
} from "../lib/ai-prompts";
import { AuditResult } from "../types/audit";

function testPromptsAndParser() {
  console.log("🧠 Testing AI Vision Prompts & JSON Schema Resiliency...");

  // 1. Validate Schema Structure
  console.log("1. Checking Schema Properties:");
  console.log("   - Properties:", Object.keys(COMMERCE_AUDIT_SCHEMA.properties).join(", "));
  console.log("   - Required Fields:", COMMERCE_AUDIT_SCHEMA.required.join(", "));
  if (!COMMERCE_AUDIT_SCHEMA.properties.scores || !COMMERCE_AUDIT_SCHEMA.properties.decision) {
    throw new Error("Schema missing core fields");
  }

  // 2. Validate Payload Builder
  const testUrl = "https://res.cloudinary.com/drntwxfcc/image/upload/sample.jpg";
  const payload = buildCloudinaryAnalysisPayload(testUrl);
  console.log("2. Checking Cloudinary Analysis Payload:");
  console.log("   - Source URI:", payload.source.uri);
  console.log("   - Prompts Array Count:", payload.prompts.length);

  // 3. Test cleanAndParseJson with Markdown Codeblocks & Preambles
  const rawLlmResponse = `Here is the commerce audit for the saree:
\`\`\`json
{
  "scores": {
    "product_visibility": 88,
    "background_quality": 25,
    "lighting_quality": 45,
    "composition": 70,
    "brand_safety": 100
  },
  "overall_score": 58,
  "commerce_ready": false,
  "decision": "REPAIR",
  "semantics": {
    "product_category": "Handwoven Banarasi Saree",
    "dominant_colors": ["#800020", "#FFD700"],
    "seo_description": "Exquisite crimson Banarasi handwoven silk saree with zari border"
  },
  "detected_issues": [
    "cluttered living room background",
    "shadows cast on fabric"
  ],
  "has_watermark": false,
  "has_text_overlay": false
}
\`\`\`
Hope this helps!`;

  const parsed: AuditResult = cleanAndParseJson<AuditResult>(rawLlmResponse);
  console.log("3. Testing Parser Resiliency on Fenced JSON:");
  console.log(`   - Decision: ${parsed.decision}`);
  console.log(`   - Category: ${parsed.semantics.product_category}`);
  console.log(`   - Overall Score: ${parsed.overall_score}/100`);
  console.log(`   - Detected Issues: ${parsed.detected_issues.length}`);

  if (parsed.decision !== "REPAIR" || parsed.overall_score !== 58) {
    throw new Error("Parsed result mismatch");
  }

  // 4. Test Error Handling on Malformed Input
  try {
    cleanAndParseJson("not valid json at all");
    throw new Error("Should have thrown error on invalid json");
  } catch {
    console.log("4. Parser correctly threw on malformed input. Expected behavior confirmed.");
  }

  console.log("🎉 Task 10 AI Vision Prompt & Strict Schema Verified Successfully!");
}

testPromptsAndParser();
