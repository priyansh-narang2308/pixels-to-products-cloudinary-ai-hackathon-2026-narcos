import { NextRequest, NextResponse } from "next/server";
import { runLuminaPipeline } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      publicId,
      secureUrl,
      userId,
      format,
      width,
      height,
      bytes,
      resourceType,
      isSync,
    } = body;

    if (!publicId || !secureUrl) {
      return NextResponse.json(
        { error: "Missing required parameters: 'publicId' and 'secureUrl'" },
        { status: 400 }
      );
    }

    let asset = await prisma.asset.findUnique({
      where: { publicId },
    });

    if (!asset) {

      let effectiveUserId = userId;
      if (!effectiveUserId) {
        const defaultUser = await prisma.user.upsert({
          where: { email: "demo-artisan@lumina.ai" },
          update: {},
          create: {
            id: "demo-artisan-01",
            email: "demo-artisan@lumina.ai",
            name: "Artisan Merchant",
            role: "artisan",
          },
        });
        effectiveUserId = defaultUser.id;
      }

      asset = await prisma.asset.create({
        data: {
          publicId,
          secureUrl,
          userId: effectiveUserId,
          status: "pending",
          resourceType: resourceType || "image",
          format: format || "jpg",
          width: width ? Number(width) : null,
          height: height ? Number(height) : null,
          bytes: bytes ? Number(bytes) : null,
        },
      });
    }

    const assetId = asset.id;

    if (isSync === true) {
      const result = await runLuminaPipeline({
        publicId,
        secureUrl,
        assetId,
        userId: asset.userId,
        format,
        width,
        height,
        bytes,
        resourceType,
      });

      return NextResponse.json({
        success: true,
        assetId,
        result,
      });
    }

    runLuminaPipeline({
      publicId,
      secureUrl,
      assetId,
      userId: asset.userId,
      format,
      width,
      height,
      bytes,
      resourceType,
    }).catch((pipelineErr) => {
      console.error(`[Pipeline Async Error] Asset ${publicId} failed:`, pipelineErr);
    });

    return NextResponse.json({
      success: true,
      assetId,
      publicId,
      status: "processing",
      eventsUrl: `/api/events?assetId=${assetId}`,
      trackingUrl: `/dashboard?assetId=${assetId}`,
    });
  } catch (err: unknown) {
    console.error("[API /api/pipeline POST Error]:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");
    const publicId = searchParams.get("publicId");

    if (!assetId && !publicId) {
      return NextResponse.json(
        { error: "Missing required query parameter: 'assetId' or 'publicId'" },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({
      where: assetId ? { id: assetId } : { publicId: publicId! },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (err: unknown) {
    console.error("[API /api/pipeline GET Error]:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
