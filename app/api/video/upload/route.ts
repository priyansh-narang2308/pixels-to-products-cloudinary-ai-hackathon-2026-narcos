import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId, title, category } = body;

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "publicId is required" },
        { status: 400 },
      );
    }

    const result = await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      resource_type: "video",
      eager: [

        { streaming_profile: "full_hd", format: "m3u8" },
      ],
      eager_async: true,
      eager_notification_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/cloudinary`,
    });

    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drntwxfcc";
    const hlsUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/${publicId}.m3u8`;
    const mp4Url = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${publicId}.mp4`;

    const user = await prisma.user.upsert({
      where: { email: "demo-artisan@lumina.ai" },
      update: {},
      create: {
        email: "demo-artisan@lumina.ai",
        name: "Priyansh (Artisan Demo)",
        role: "artisan",
      },
    });

    const asset = await prisma.asset.upsert({
      where: { publicId },
      update: {
        hlsPlaylistUrl: hlsUrl,
        resourceType: "video",
        status: "approved",
      },
      create: {
        publicId,
        secureUrl: result.secure_url || mp4Url,
        resourceType: "video",
        format: result.format || "mp4",
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        hlsPlaylistUrl: hlsUrl,
        status: "approved",
        decision: "PASS",
        productCategory: category || "Video Media",
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      assetId: asset.id,
      publicId,
      hlsUrl,
      mp4Url,
      eagerStatus: result.eager?.[0]?.status || "async_pending",
    });
  } catch (error) {
    console.error("[Video Upload] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Video processing failed",
      },
      { status: 500 },
    );
  }
}
