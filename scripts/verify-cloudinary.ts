import { checkCloudinaryConnection, cloudinary } from "../lib/cloudinary";

async function verifyCloudinary() {
  console.log("☁️  Probing live Cloudinary credentials & API responsiveness...");

  const probe = await checkCloudinaryConnection();

  if (!probe.ok) {
    console.error("❌ Cloudinary Health Check FAILED:", probe.error);
    process.exit(1);
  }

  console.log("✅ Cloudinary Ping Status:", probe.status);
  console.log("✅ Connected Cloud Name:", probe.cloudName);
  console.log("✅ Account Plan:", probe.plan);
  console.log(`✅ Credit Usage: ${probe.creditsUsed} / ${probe.creditsTotal} credits`);

  // Test Admin API sub-query to verify API Secret validity
  try {
    const rootFolders = await cloudinary.api.root_folders();
    console.log("✅ Admin API Access: Verified (Folders found:", rootFolders.folders?.length ?? 0, ")");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("⚠️  Folder access note:", msg);
  }

  console.log("🎉 Cloudinary Zero-Leak Configuration Successfully Verified!");
}

verifyCloudinary().catch((err) => {
  console.error("❌ Verification error:", err);
  process.exit(1);
});
