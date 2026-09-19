
import { cloudinary } from "@/lib/cloudinary";

export interface LuminaMetadataPayload {
  qcStatus: "pending" | "approved" | "auto_repaired" | "rejected";
  category?: string;
  scoreBefore?: number;
  scoreAfter?: number;
  seoDesc?: string;
  dominantColors?: string[];
  repairActions?: string[];
}

export async function attachLuminaMetadata(
  publicId: string,
  payload: LuminaMetadataPayload,
): Promise<boolean> {
  try {
    const metadataObj: Record<string, string | number> = {
      lumina_qc_status: payload.qcStatus,
    };

    if (payload.category) {
      metadataObj.lumina_category = payload.category.substring(0, 100);
    }
    if (payload.scoreBefore !== undefined) {
      metadataObj.lumina_score_before = Math.round(payload.scoreBefore);
    }
    if (payload.scoreAfter !== undefined) {
      metadataObj.lumina_score_after = Math.round(payload.scoreAfter);
    }
    if (payload.seoDesc) {
      metadataObj.lumina_seo_desc = payload.seoDesc.substring(0, 255);
    }
    if (payload.dominantColors && payload.dominantColors.length > 0) {
      metadataObj.lumina_dominant_colors = payload.dominantColors
        .slice(0, 5)
        .join(", ");
    }
    if (payload.repairActions && payload.repairActions.length > 0) {
      metadataObj.lumina_repair_actions = payload.repairActions
        .slice(0, 5)
        .join(" | ");
    }

    const tags = [
      "lumina",
      `lumina_${payload.qcStatus}`,
      `score_${payload.scoreAfter || payload.scoreBefore || 0}`,
    ];
    if (payload.category) {
      tags.push(
        `cat_${payload.category.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      );
    }

    const metadataString = Object.entries(metadataObj)
      .map(([k, v]) => `${k}=${String(v).replace(/[|=]/g, " ")}`)
      .join("|");

    await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      metadata: metadataString,
      tags: tags,
      context: {
        qc_status: payload.qcStatus,
        score: String(payload.scoreAfter || payload.scoreBefore || 0),
        category: payload.category || "Artisan",
      },
    });

    console.log(
      `[Cloudinary Metadata] 🏷️ Attached structured metadata & tags to ${publicId}`,
    );
    return true;
  } catch (err: unknown) {
    console.warn(
      `[Cloudinary Metadata] Non-critical metadata attachment note for ${publicId}:`,
      err,
    );
    return false;
  }
}
