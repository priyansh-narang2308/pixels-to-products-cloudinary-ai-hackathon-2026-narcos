import { AssetFamilyUrls, AuditResult, AuditSemantics } from "@/types/audit";
import { resolveCategoryPrompt } from "@/lib/decision-engine";
import { getCldOgImageUrl } from "next-cloudinary";

export function getCloudName(): string {
  const name =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    "drntwxfcc";
  return name;
}

export function buildDeliveryUrl(
  publicId: string,
  transformations: string[] = [],
): string {
  const cloudName = getCloudName();
  const cleanTransforms = transformations.filter(Boolean);

  cleanTransforms.push("f_auto,q_auto");

  const transformString = cleanTransforms.join("/");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

export function buildEnhancedRepairChain(audit: AuditResult): {
  transforms: string[];
  transformChain: string;
} {
  const transforms: string[] = [];

  if (audit.scores.lighting_quality < 60) {
    transforms.push("e_improve:50");
  }

  if (audit.scores.product_visibility < 80) {
    transforms.push("e_sharpen:80");
  }

  if (audit.scores.lighting_quality < 70) {
    transforms.push("e_vibrance:25");
  }

  if (audit.scores.background_quality < 70) {
    const categoryPrompt = resolveCategoryPrompt(
      audit.semantics?.product_category,
    );
    const encodedPrompt = categoryPrompt.replace(/\s+/g, "_");
    transforms.push(`e_gen_background_replace:prompt_${encodedPrompt}`);
  }

  if (audit.scores.composition < 65) {
    transforms.push("c_auto,g_auto,w_1080,h_1080");
  }

  return {
    transforms,
    transformChain: transforms.join("/"),
  };
}

export function buildRepairedImageUrl(
  publicId: string,
  baseTransformChain = "",
  category = "",
): string {
  const transforms: string[] = [];

  if (baseTransformChain) {
    transforms.push(baseTransformChain);
  } else {
    const prompt = resolveCategoryPrompt(category);
    const encoded = prompt.replace(/\s+/g, "_");
    transforms.push("e_improve:50");
    transforms.push(`e_gen_background_replace:prompt_${encoded}`);
  }

  return buildDeliveryUrl(publicId, transforms);
}

export function generateHeroUrl(publicId: string, baseTransform = ""): string {
  const transforms: string[] = [];
  if (baseTransform) transforms.push(baseTransform);
  transforms.push("c_pad,b_gen_fill,ar_1:1,w_1080");
  return buildDeliveryUrl(publicId, transforms);
}

export function generateMarketplaceUrl(
  publicId: string,
  baseTransform = "",
): string {
  const transforms: string[] = [];
  if (baseTransform) transforms.push(baseTransform);
  transforms.push("c_pad,b_gen_fill,ar_4:5,w_800");
  return buildDeliveryUrl(publicId, transforms);
}

export function generateBannerUrl(
  publicId: string,
  baseTransform = "",
): string {
  const transforms: string[] = [];
  if (baseTransform) transforms.push(baseTransform);
  transforms.push("c_pad,b_gen_fill,ar_16:9,w_1920");
  return buildDeliveryUrl(publicId, transforms);
}

export function generateLifestyleUrl(
  publicId: string,
  baseTransform = "",
  category = "",
): string {
  const transforms: string[] = [];
  if (baseTransform) transforms.push(baseTransform);

  const lifestylePrompt = `elegant_lifestyle_setting_with_warm_ambient_sunlight_and_subtle_bokeh_background`;
  transforms.push(`e_gen_background_replace:prompt_${lifestylePrompt}`);
  transforms.push("c_pad,ar_4:3,w_1200");

  return buildDeliveryUrl(publicId, transforms);
}

export function generateSocialCardUrl(
  publicId: string,
  category = "Artisan Product",
  score = 94,
): string {
  const cloudName = getCloudName();
  const encodedTitle = encodeURIComponent(category.substring(0, 32));
  const badgeText = encodeURIComponent(`Verified ${score}/100`);

  const transform = [
    "c_pad,b_gen_fill,ar_1200:630,w_1200,h_630",
    "e_vibrance:30",
    `l_text:Arial_44_bold:${encodedTitle},co_rgb:FFFFFF,g_north_west,x_60,y_60`,
    `l_text:Arial_24_bold:${badgeText},co_rgb:22C55E,g_south_west,x_60,y_60`,
    "f_auto,q_auto",
  ].join("/");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export function getSocialOgImageUrl(
  publicId: string,
  category = "Artisan Product",
): string {
  try {
    return getCldOgImageUrl({
      src: publicId,
      width: 1200,
      height: 630,
      crop: "pad",
      background: "gen_fill",
      overlays: [
        {
          text: {
            color: "white",
            fontFamily: "Arial",
            fontSize: 44,
            fontWeight: "bold",
            text: category.substring(0, 32),
          },
          position: {
            gravity: "north_west",
            x: 60,
            y: 60,
          },
        },
      ],
    });
  } catch {
    return generateSocialCardUrl(publicId, category, 94);
  }
}

export function generateAssetFamily(
  publicId: string,
  baseTransform = "",
  semantics?: Partial<AuditSemantics>,
  score = 94,
): AssetFamilyUrls {
  const category = semantics?.product_category || "Artisan Product";

  return {
    hero: generateHeroUrl(publicId, baseTransform),
    marketplace: generateMarketplaceUrl(publicId, baseTransform),
    banner: generateBannerUrl(publicId, baseTransform),
    lifestyle: generateLifestyleUrl(publicId, baseTransform, category),
    social: generateSocialCardUrl(publicId, category, score),
  };
}
