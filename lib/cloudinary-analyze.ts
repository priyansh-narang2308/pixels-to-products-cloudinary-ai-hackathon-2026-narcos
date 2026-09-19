import { AuditResult } from "@/types/audit";
import {
  cleanAndParseJson,
  buildCloudinaryAnalysisPayload,
} from "@/lib/ai-prompts";
import { validateCloudinaryConfig } from "@/lib/cloudinary";

const analysisCache = new Map<string, AuditResult>();

export async function analyzeAssetWithCloudinary(
  imageUrl: string,
): Promise<AuditResult> {

  if (analysisCache.has(imageUrl)) {
    return analysisCache.get(imageUrl)!;
  }

  const { cloudName, apiKey, apiSecret } = validateCloudinaryConfig();

  const endpoint = `https://api.cloudinary.com/v2/analysis/${cloudName}/analyze/ai_vision_general`;
  const payload = buildCloudinaryAnalysisPayload(imageUrl);

  const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudinary Analyze API error (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const data = await response.json();

  const rawAnalysis =
    data?.data?.analysis ||
    data?.analysis ||
    (typeof data === "string" ? data : JSON.stringify(data));

  const parsedResult = cleanAndParseJson<AuditResult>(rawAnalysis);
  parsedResult.rawResponse = data;

  analysisCache.set(imageUrl, parsedResult);

  return parsedResult;
}
