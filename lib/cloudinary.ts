import { existsSync } from "node:fs";
import { v2 as cloudinary } from "cloudinary";

if (
  !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  typeof process.loadEnvFile === "function"
) {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  } else if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}

export function validateCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing: string[] = [];
    if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    if (!apiKey) missing.push("NEXT_PUBLIC_CLOUDINARY_API_KEY");
    if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

    throw new Error(
      `[Lumina Cloudinary Error] Missing required Cloudinary configuration: ${missing.join(", ")}. Please check your .env.local file.`,
    );
  }

  return { cloudName, apiKey, apiSecret };
}

const { cloudName, apiKey, apiSecret } = validateCloudinaryConfig();

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export async function checkCloudinaryConnection(): Promise<{
  ok: boolean;
  status: string;
  cloudName: string;
  plan?: string;
  creditsUsed?: number;
  creditsTotal?: number;
  error?: string;
}> {
  try {
    const pingResult = await cloudinary.api.ping();
    let plan = "Free Tier";
    let creditsUsed = 0;
    let creditsTotal = 25;

    try {
      const usageResult = await cloudinary.api.usage();
      if (usageResult?.plan) plan = usageResult.plan;
      if (usageResult?.credits) {
        creditsUsed = usageResult.credits.usage || 0;
        creditsTotal = usageResult.credits.credits || 25;
      }
    } catch {

    }

    return {
      ok: pingResult.status === "ok",
      status: pingResult.status,
      cloudName,
      plan,
      creditsUsed,
      creditsTotal,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: "error",
      cloudName,
      error: errorMessage,
    };
  }
}

export { cloudinary };
