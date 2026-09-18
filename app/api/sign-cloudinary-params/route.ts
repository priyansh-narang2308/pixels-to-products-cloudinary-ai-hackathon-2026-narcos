import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (!paramsToSign || typeof paramsToSign !== "object") {
      return NextResponse.json(
        { error: "Invalid request: paramsToSign object is required" },
        { status: 400 },
      );
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: CLOUDINARY_API_SECRET is missing" },
        { status: 500 },
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return NextResponse.json({ signature });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal signing error";
    console.error("[Lumina Signing Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
