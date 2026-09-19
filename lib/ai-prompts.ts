import { AuditResult } from "@/types/audit";

export const COMMERCE_AUDIT_PROMPT = `You are a senior e-commerce catalog quality assurance director for global marketplaces (Amazon, Flipkart, Shopify).
Inspect this product image for commercial listing compliance and catalog readiness.

Analyze the image across these 5 core dimensions (score each from 0 to 100):
1. product_visibility (0-100): Is the product clearly in focus, sharply delineated, well-lit, and the unambiguous focal point?
2. background_quality (0-100): Is the background clean, uncluttered, neutral, and free from domestic clutter (bedsheets, wires, floor tiles, distracting patterns)?
3. lighting_quality (0-100): Is the lighting balanced, natural or studio-grade, free of harsh glare, deep muddy shadows, or sensor noise?
4. composition (0-100): Is the product properly framed, centered, occupying 75-85% of the frame without awkward edge cropping?
5. brand_safety (0-100): Is the image free from unauthorized third-party watermarks, stock photo stamps, offensive content, or copyrighted branding?

Rules for decision:
- If 'has_watermark' is true or 'brand_safety' < 50: decision MUST be "REJECT".
- If 'overall_score' >= 80 and 'background_quality' >= 75 and 'lighting_quality' >= 70: decision MUST be "PASS".
- Otherwise: decision MUST be "REPAIR".

Extract semantic commerce attributes:
- product_category: Concise category title (e.g., "Kanchipuram Silk Saree", "Brass Nataraja Idol", "Ceramic Tea Mug", "Handmade Leather Tote").
- dominant_colors: Array of 1 to 3 hex color codes representing the primary colors of the product itself.
- seo_description: An engaging, accurate, 1-sentence product description optimized for e-commerce search listings.
- detected_issues: Specific visual defects observed (e.g., "cluttered bedsheet background", "harsh glare on upper rim", "off-center composition").

Return ONLY a valid JSON object strictly adhering to the specified schema.`;

export const COMMERCE_AUDIT_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "object",
      properties: {
        product_visibility: { type: "integer", minimum: 0, maximum: 100 },
        background_quality: { type: "integer", minimum: 0, maximum: 100 },
        lighting_quality: { type: "integer", minimum: 0, maximum: 100 },
        composition: { type: "integer", minimum: 0, maximum: 100 },
        brand_safety: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: [
        "product_visibility",
        "background_quality",
        "lighting_quality",
        "composition",
        "brand_safety",
      ],
    },
    overall_score: { type: "integer", minimum: 0, maximum: 100 },
    commerce_ready: { type: "boolean" },
    decision: {
      type: "string",
      enum: ["PASS", "REPAIR", "REJECT"],
    },
    semantics: {
      type: "object",
      properties: {
        product_category: { type: "string" },
        dominant_colors: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3,
        },
        seo_description: { type: "string" },
      },
      required: ["product_category", "dominant_colors", "seo_description"],
    },
    detected_issues: {
      type: "array",
      items: { type: "string" },
    },
    has_watermark: { type: "boolean" },
    has_text_overlay: { type: "boolean" },
  },
  required: [
    "scores",
    "overall_score",
    "commerce_ready",
    "decision",
    "semantics",
    "detected_issues",
    "has_watermark",
    "has_text_overlay",
  ],
};

export function cleanAndParseJson<T = AuditResult>(rawText: string): T {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Cannot parse empty or non-string response");
  }

  let cleaned = rawText.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (!parsed.scores) {
      parsed.scores = {
        product_visibility: 70,
        background_quality: 40,
        lighting_quality: 50,
        composition: 60,
        brand_safety: 90,
      };
    }

    if (typeof parsed.overall_score !== "number") {
      const s = parsed.scores;
      parsed.overall_score = Math.round(
        s.product_visibility * 0.3 +
          s.background_quality * 0.25 +
          s.lighting_quality * 0.2 +
          s.composition * 0.15 +
          s.brand_safety * 0.1,
      );
    }

    if (!parsed.decision) {
      if (parsed.has_watermark) parsed.decision = "REJECT";
      else if (parsed.overall_score >= 80) parsed.decision = "PASS";
      else parsed.decision = "REPAIR";
    }

    if (!parsed.detected_issues) parsed.detected_issues = [];
    if (!parsed.semantics) {
      parsed.semantics = {
        product_category: "Commerce Product",
        dominant_colors: ["#333333"],
        seo_description: "Commercial product catalog listing",
      };
    }

    return parsed as T;
  } catch (err) {
    console.error(
      "[cleanAndParseJson Error]: Failed to parse raw string:",
      rawText,
    );
    throw new Error(
      `Invalid JSON output from AI Vision: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function buildCloudinaryAnalysisPayload(imageUrl: string) {
  return {
    source: { uri: imageUrl },
    prompts: [
      COMMERCE_AUDIT_PROMPT,
      "```json\n" + JSON.stringify(COMMERCE_AUDIT_SCHEMA, null, 2) + "\n```",
    ],
  };
}
