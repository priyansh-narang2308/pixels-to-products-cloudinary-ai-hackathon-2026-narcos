import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { runLuminaPipeline } from "@/lib/pipeline";
import { invalidateCatalogCache } from "@/lib/cache-invalidation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-cld-signature");
    const timestamp = Number(request.headers.get("x-cld-timestamp"));

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Cloudinary signature or timestamp headers" },
        { status: 401 }
      );
    }

    const isValid = cloudinary.utils.verifyNotificationSignature(
      rawBody,
      timestamp,
      signature,
      7200 // 2 hours
    );

    if (!isValid) {
      console.warn("[Cloudinary Webhook] ❌ HMAC Signature verification failed!");
      return NextResponse.json(
        { error: "Forbidden: Cryptographic signature mismatch" },
        { status: 403 }
      );
    }

    const payload = JSON.parse(rawBody);
    const {
      notification_type,
      public_id,
      secure_url,
      format,
      bytes,
      width,
      height,
      resource_type,
    } = payload;

    console.log(
      `[Cloudinary Webhook] 📬 Verified ${notification_type} notification for: ${public_id}`
    );

    if (notification_type === "upload" || notification_type === "eager") {
      if (public_id && secure_url) {

        runLuminaPipeline({
          publicId: public_id,
          secureUrl: secure_url,
          format,
          bytes: bytes ? Number(bytes) : undefined,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          resourceType: resource_type || "image",
        })
          .then(() => {
            invalidateCatalogCache(public_id);
          })
          .catch((pipelineErr) => {
            console.error(
              `[Cloudinary Webhook] Pipeline compilation error for ${public_id}:`,
              pipelineErr
            );
          });
      }
    }

    return NextResponse.json({
      received: true,
      publicId: public_id,
      notificationType: notification_type,
      timestamp,
    });
  } catch (err: unknown) {
    console.error("[Cloudinary Webhook Error]:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
