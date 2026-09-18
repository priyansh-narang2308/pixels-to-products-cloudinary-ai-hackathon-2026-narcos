/**
 * Lumina Cognitive Commerce Audit Type Contracts
 * Track 1: AI Media Pipelines — Cloudinary AI Hackathon 2026
 */

export type AuditDecision = "PASS" | "REPAIR" | "REJECT";

export interface ScoreBreakdown {
  /** Clarity, focus, and visual prominence of the product subject (0-100) */
  product_visibility: number;
  /** Cleanliness, lack of clutter, isolation, and appropriateness of background (0-100) */
  background_quality: number;
  /** Professionalism, balance, dynamic range, and shadow softness (0-100) */
  lighting_quality: number;
  /** Aspect ratio alignment, centering, margins, and marketplace framing (0-100) */
  composition: number;
  /** Freedom from watermarks, offensive content, or unauthorized third-party logos (0-100) */
  brand_safety: number;
}

export interface AuditSemantics {
  /** Detected product type/category (e.g. "Handwoven Saree", "Brass Idol", "Leather Handbag") */
  product_category: string;
  /** Top 3 dominant hex color codes detected in product (e.g. ["#8B4513", "#FFD700", "#DC143C"]) */
  dominant_colors: string[];
  /** 1-sentence marketplace-ready SEO product listing description */
  seo_description: string;
}

export interface AuditResult {
  /** Granular 5-dimension breakdown */
  scores: ScoreBreakdown;
  /** Weighted overall Commerce Readiness Score (0-100) */
  overall_score: number;
  /** Whether the image meets minimum marketplace listing threshold (score >= 80) */
  commerce_ready: boolean;
  /** Autonomous routing decision */
  decision: AuditDecision;
  /** Specific defects diagnosed by AI inspection */
  detected_issues: string[];
  /** Copyright compliance flag */
  has_watermark: boolean;
  /** Text overlay defect flag */
  has_text_overlay: boolean;
  /** Semantic catalog intelligence */
  semantics: AuditSemantics;
  /** Raw AI provider response payload (for audit trail storage) */
  rawResponse?: unknown;
}

export interface VerificationResult {
  initial: AuditResult;
  verified: AuditResult;
  scoreBefore: number;
  scoreAfter: number;
  scoreDelta: number;
  passedGate: boolean;
  approvalStatus: "approved" | "rejected";
  dimensionDeltas: {
    product_visibility: number;
    background_quality: number;
    lighting_quality: number;
    composition: number;
    brand_safety: number;
  };
}

export interface AssetFamilyUrls {
  /** 1:1 Amazon / Shopify Hero product shot with clean studio background */
  hero: string;
  /** 4:5 Flipkart / Myntra mobile catalog feed card with generative fill padding */
  marketplace: string;
  /** 16:9 Editorial website billboard banner outpainted with generative fill */
  banner: string;
  /** In-situ contextual lifestyle visual with warm ambient lighting */
  lifestyle: string;
  /** 1200x630 dynamic Open Graph social card with dynamic typography overlay */
  social: string;
}

export interface PipelineEventPayload {
  step:
    | "upload"
    | "audit_1"
    | "decision"
    | "transform"
    | "audit_2"
    | "compile"
    | "complete";
  status: "started" | "complete" | "failed" | "rejected";
  assetId?: string;
  score?: number;
  scoreBefore?: number;
  scoreAfter?: number;
  improvement?: number;
  decision?: AuditDecision;
  issues?: string[];
  reason?: string;
  familyUrls?: AssetFamilyUrls;
  timestamp?: number;
}
