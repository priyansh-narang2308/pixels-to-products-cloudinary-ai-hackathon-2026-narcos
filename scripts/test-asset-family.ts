import {
  buildDeliveryUrl,
  buildRepairedImageUrl,
  generateHeroUrl,
  generateMarketplaceUrl,
  generateBannerUrl,
  generateLifestyleUrl,
  generateSocialCardUrl,
  generateAssetFamily,
} from "../lib/asset-family";

function testAssetFamilyBuilders() {
  console.log("🎨 Testing Transformation URL Constructor & Generative Fill Engines (Tasks 17, 18, 19)...\n");

  const testPublicId = "lumina/uploads/saree_test_01";
  const baseTransform = "e_improve:50/e_gen_background_replace:prompt_minimal_white_studio";

  // 1. Task 17: Base Delivery URL Constructor
  console.log("1. Testing Base Delivery URL Constructor:");
  const deliveryUrl = buildDeliveryUrl(testPublicId, ["c_pad,w_500"]);
  console.log("   - Delivery URL:", deliveryUrl);
  if (!deliveryUrl.includes("f_auto,q_auto") || !deliveryUrl.includes("res.cloudinary.com")) {
    throw new Error("Invalid base delivery URL structure");
  }
  console.log("   ✅ Passed\n");

  // 2. Task 18: Background Synthesis URL Constructor
  console.log("2. Testing Background Synthesis Engine (e_gen_background_replace):");
  const repairedUrl = buildRepairedImageUrl(testPublicId, baseTransform);
  console.log("   - Repaired URL:", repairedUrl);
  if (!repairedUrl.includes("e_gen_background_replace")) {
    throw new Error("Missing e_gen_background_replace in repaired URL");
  }
  console.log("   ✅ Passed\n");

  // 3. Task 19: Generative Fill & Aspect-Ratio Outpainting
  console.log("3. Testing Generative Fill Outpainting:");
  const heroUrl = generateHeroUrl(testPublicId, baseTransform);
  const marketplaceUrl = generateMarketplaceUrl(testPublicId, baseTransform);
  const bannerUrl = generateBannerUrl(testPublicId, baseTransform);

  console.log("   - Hero (1:1):", heroUrl);
  console.log("   - Marketplace (4:5):", marketplaceUrl);
  console.log("   - Banner (16:9):", bannerUrl);

  if (!heroUrl.includes("ar_1:1") || !heroUrl.includes("b_gen_fill")) {
    throw new Error("Hero URL missing ar_1:1 or b_gen_fill");
  }
  if (!marketplaceUrl.includes("ar_4:5") || !marketplaceUrl.includes("b_gen_fill")) {
    throw new Error("Marketplace URL missing ar_4:5 or b_gen_fill");
  }
  if (!bannerUrl.includes("ar_16:9") || !bannerUrl.includes("b_gen_fill")) {
    throw new Error("Banner URL missing ar_16:9 or b_gen_fill");
  }
  console.log("   ✅ Passed\n");

  // 4. Test Complete 5-Asset Omnichannel Family Compilation
  console.log("4. Testing Complete 5-Asset Family Compilation:");
  const family = generateAssetFamily(testPublicId, baseTransform, {
    product_category: "Banarasi Silk Saree",
  }, 94);

  console.log("   - Family Keys:", Object.keys(family).join(", "));
  if (!family.hero || !family.marketplace || !family.banner || !family.lifestyle || !family.social) {
    throw new Error("Missing variant in compiled family");
  }

  console.log("\n🎉 Tasks 17, 18, and 19 Verified with 100% Success!");
}

testAssetFamilyBuilders();
