import { prisma } from "@/lib/prisma";
import { AssetFamilyUrls } from "@/types/audit";

export async function getCachedAssetFamily(
  publicId: string,
): Promise<AssetFamilyUrls | null> {
  try {
    const asset = await prisma.asset.findUnique({
      where: { publicId },
      select: {
        heroUrl: true,
        marketplaceUrl: true,
        bannerUrl: true,
        lifestyleUrl: true,
        socialUrl: true,
      },
    });

    if (
      asset &&
      asset.heroUrl &&
      asset.marketplaceUrl &&
      asset.bannerUrl &&
      asset.lifestyleUrl &&
      asset.socialUrl
    ) {
      return {
        hero: asset.heroUrl,
        marketplace: asset.marketplaceUrl,
        banner: asset.bannerUrl,
        lifestyle: asset.lifestyleUrl,
        social: asset.socialUrl,
      };
    }

    return null;
  } catch (err) {
    console.error(
      "[Transform Cache Error]: Failed to read cache from DB:",
      err,
    );
    return null;
  }
}

export async function persistAssetFamily(
  publicId: string,
  familyUrls: AssetFamilyUrls,
  repairChain?: string,
): Promise<void> {
  try {
    await prisma.asset.update({
      where: { publicId },
      data: {
        heroUrl: familyUrls.hero,
        marketplaceUrl: familyUrls.marketplace,
        bannerUrl: familyUrls.banner,
        lifestyleUrl: familyUrls.lifestyle,
        socialUrl: familyUrls.social,
        transformChain: repairChain,
      },
    });
  } catch (err) {
    console.error(
      "[Transform Cache Error]: Failed to persist URLs in DB:",
      err,
    );
  }
}
