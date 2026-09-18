import { NextRequest, NextResponse } from "next/server";
import {
  searchLuminaCatalog,
  searchDatabaseCatalog,
} from "@/lib/cloudinary-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query =
      searchParams.get("q") || searchParams.get("query") || undefined;
    const status =
      (searchParams.get("status") as
        | "all"
        | "approved"
        | "auto_repaired"
        | "rejected"
        | "pending") || undefined;
    const category = searchParams.get("category") || undefined;
    const minScore = searchParams.get("minScore")
      ? Number(searchParams.get("minScore"))
      : undefined;
    const maxScore = searchParams.get("maxScore")
      ? Number(searchParams.get("maxScore"))
      : undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 24;
    const cursor = searchParams.get("cursor") || undefined;
    const sortBy =
      (searchParams.get("sortBy") as "created_at" | "score") || "created_at";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const source = searchParams.get("source") || "auto";

    let result;

    if (source === "db") {
      result = await searchDatabaseCatalog({
        query,
        status,
        category,
        minScore,
        maxScore,
        limit,
        sortBy,
        sortOrder,
      });
    } else {
      result = await searchLuminaCatalog({
        query,
        status,
        category,
        minScore,
        maxScore,
        limit,
        cursor,
        sortBy,
        sortOrder,
      });
    }

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
        },
      },
    );
  } catch (err: unknown) {
    console.error("[API /api/catalog/search Error]:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
