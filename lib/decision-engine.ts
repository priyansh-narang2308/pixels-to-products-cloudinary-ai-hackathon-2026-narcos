import { AuditResult, AuditDecision } from "@/types/audit";

export interface DecisionPlan {
  decision: AuditDecision;
  transforms: string[];
  transformChain: string;
  advisoryNote: string;
  categoryPrompt?: string;
}

export const CATEGORY_STUDIO_PROMPTS: Record<string, string> = {
  saree: "clean minimalist boutique display with soft diffuse warm lighting",
  textile: "clean minimalist boutique display with soft diffuse warm lighting",
  apparel: "clean minimalist fashion studio podium with soft lighting",
  jewelry:
    "matte black slate luxury jewelry pedestal with directional spotlight",
  brass: "warm scandinavian wooden table with soft morning window light",
  idol: "clean polished dark granite pedestal with warm golden ambient light",
  pottery:
    "warm earthy textured sandstone shelf with soft natural window sunlight",
  ceramic:
    "warm earthy textured sandstone shelf with soft natural window sunlight",
  leather: "sleek architectural concrete surface with minimal shadows",
  handicraft: "clean neutral studio backdrop with soft natural contact shadow",
  default: "clean minimal white studio background with soft contact shadow",
};

export function resolveCategoryPrompt(category = ""): string {
  const normalized = category.toLowerCase();
  for (const [key, prompt] of Object.entries(CATEGORY_STUDIO_PROMPTS)) {
    if (normalized.includes(key)) {
      return prompt;
    }
  }
  return CATEGORY_STUDIO_PROMPTS.default;
}

export function determineTransformations(audit: AuditResult): DecisionPlan {

  if (audit.has_watermark || audit.scores.brand_safety < 50) {
    return {
      decision: "REJECT",
      transforms: [],
      transformChain: "",
      advisoryNote:
        "Listing rejected by automated compliance policy: Unauthorized watermark or copyright stamp detected. Please upload original, un-watermarked seller photography.",
    };
  }

  if (
    audit.overall_score >= 80 &&
    audit.scores.background_quality >= 75 &&
    audit.scores.lighting_quality >= 65
  ) {
    return {
      decision: "PASS",
      transforms: [],
      transformChain: "",
      advisoryNote:
        "Commerce readiness verified: Image satisfies all marketplace quality criteria. Ready for omnichannel asset compilation.",
    };
  }

  const transforms: string[] = [];
  const issuesFixed: string[] = [];

  if (audit.scores.lighting_quality < 65) {
    transforms.push("e_improve:50");
    issuesFixed.push("balanced ambient illumination");
  }

  if (audit.scores.background_quality < 70) {
    const categoryPrompt = resolveCategoryPrompt(
      audit.semantics?.product_category,
    );

    const encodedPrompt = categoryPrompt.replace(/\s+/g, "_");
    transforms.push(`e_gen_background_replace:prompt_${encodedPrompt}`);
    issuesFixed.push("synthesized studio-grade neutral background");
  }

  if (audit.scores.composition < 65) {
    transforms.push("c_auto,g_auto,w_1080,h_1080");
    issuesFixed.push("centered marketplace composition");
  }

  if (transforms.length === 0) {
    transforms.push("e_improve:40");
    transforms.push("c_auto,g_auto");
    issuesFixed.push("general catalog polish");
  }

  const transformChain = transforms.join("/");

  return {
    decision: "REPAIR",
    transforms,
    transformChain,
    categoryPrompt: resolveCategoryPrompt(audit.semantics?.product_category),
    advisoryNote: `Autonomous repair plan generated: ${issuesFixed.join(", ")}.`,
  };
}
