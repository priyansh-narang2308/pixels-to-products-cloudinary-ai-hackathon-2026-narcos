
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { generateAssetFamily } from "@/lib/asset-family";
import {
  buildLuceneSearchExpression,
  CatalogSearchFilter,
} from "@/lib/search-query-builder";
import { AssetFamilyUrls } from "@/types/audit";

export interface CatalogSearchOptions extends CatalogSearchFilter {
  limit?: number;
  cursor?: string;
  sortBy?: "created_at" | "score";
  sortOrder?: "asc" | "desc";
}

export interface CatalogAssetItem {
  id?: string;
  publicId: string;
  secureUrl: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt: string;
  qcStatus: "pending" | "approved" | "auto_repaired" | "rejected";
  category: string;
  scoreBefore?: number;
  scoreAfter?: number;
  scoreDelta?: number;
  seoDescription?: string;
  dominantColors: string[];
  repairActions: string[];
  tags: string[];
  familyUrls: AssetFamilyUrls;
  source: "cloudinary" | "database";
}

export interface CatalogSearchResult {
  resources: CatalogAssetItem[];
  totalCount: number;
  nextCursor?: string;
  expression: string;
}

export async function searchLuminaCatalog(
  options: CatalogSearchOptions = {}
): Promise<CatalogSearchResult> {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const expression = buildLuceneSearchExpression(options);

  console.log(`[Cloudinary Search] 🔍 Lucene Expression: ${expression}`);

  try {
    let search = cloudinary.search
      .expression(expression)
      .with_field("metadata")
      .with_field("tags")
      .with_field("context")
      .max_results(limit);

    if (options.sortBy === "score") {
      search = search.sort_by("metadata.lumina_score_after", options.sortOrder || "desc");
    } else {
      search = search.sort_by("created_at", options.sortOrder || "desc");
    }

    if (options.cursor) {
      search = search.next_cursor(options.cursor);
    }

    const response = await search.execute();

    const resources: CatalogAssetItem[] = (response.resources || []).map(
      (res: {
        public_id: string;
        secure_url: string;
        format: string;
        width: number;
        height: number;
        bytes: number;
        created_at: string;
        metadata?: Record<string, string | number>;
        tags?: string[];
        context?: { custom?: Record<string, string> };
      }) => {
        const metadata = res.metadata || {};
        const context = res.context?.custom || {};

        const scoreBefore =
          typeof metadata.lumina_score_before === "number"
            ? metadata.lumina_score_before
            : Number(context.score || 0);

        const scoreAfter =
          typeof metadata.lumina_score_after === "number"
            ? metadata.lumina_score_after
            : Number(context.score || 0);

        const category =
          String(metadata.lumina_category || context.category || "Artisan Product");

        const qcStatus = (metadata.lumina_qc_status ||
          context.qc_status ||
          "approved") as CatalogAssetItem["qcStatus"];

        const repairActions = metadata.lumina_repair_actions
          ? String(metadata.lumina_repair_actions).split("|").map((s) => s.trim())
          : [];

        const dominantColors = metadata.lumina_dominant_colors
          ? String(metadata.lumina_dominant_colors).split(",").map((s) => s.trim())
          : [];

        const familyUrls = generateAssetFamily(
          res.public_id,
          repairActions.join("/"),
          { product_category: category },
          scoreAfter || 94
        );

        return {
          publicId: res.public_id,
          secureUrl: res.secure_url,
          format: res.format,
          width: res.width,
          height: res.height,
          bytes: res.bytes,
          createdAt: res.created_at,
          qcStatus,
          category,
          scoreBefore: scoreBefore || undefined,
          scoreAfter: scoreAfter || undefined,
          scoreDelta:
            scoreAfter && scoreBefore ? scoreAfter - scoreBefore : undefined,
          seoDescription: metadata.lumina_seo_desc ? String(metadata.lumina_seo_desc) : undefined,
          dominantColors,
          repairActions,
          tags: res.tags || [],
          familyUrls,
          source: "cloudinary" as const,
        };
      }
    );

    return {
      resources,
      totalCount: response.total_count || resources.length,
      nextCursor: response.next_cursor,
      expression,
    };
  } catch (err: unknown) {
    console.warn("[Cloudinary Search] Lucene query failed or empty, falling back to database:", err);
    return searchDatabaseCatalog(options, expression);
  }
}

export async function searchDatabaseCatalog(
  options: CatalogSearchOptions = {},
  fallbackExpr = ""
): Promise<CatalogSearchResult> {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);

  const where: Record<string, unknown> = {};

  if (options.status && options.status !== "all") {
    where.status = options.status;
  }

  if (options.category && options.category !== "all") {
    where.productCategory = {
      contains: options.category,
      mode: "insensitive",
    };
  }

  if (options.minScore !== undefined) {
    where.scoreAfter = { gte: options.minScore };
  }

  if (options.query && options.query.trim()) {
    where.OR = [
      { productCategory: { contains: options.query, mode: "insensitive" } },
      { seoDescription: { contains: options.query, mode: "insensitive" } },
      { publicId: { contains: options.query, mode: "insensitive" } },
    ];
  }

  const [dbAssets, totalCount] = await Promise.all([
    prisma.asset.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.count({ where }),
  ]);

  const resources: CatalogAssetItem[] = dbAssets.map((asset) => {
    const familyUrls: AssetFamilyUrls = {
      hero: asset.heroUrl || asset.secureUrl,
      marketplace: asset.marketplaceUrl || asset.secureUrl,
      banner: asset.bannerUrl || asset.secureUrl,
      lifestyle: asset.lifestyleUrl || asset.secureUrl,
      social: asset.socialUrl || asset.secureUrl,
    };

    return {
      id: asset.id,
      publicId: asset.publicId,
      secureUrl: asset.secureUrl,
      format: asset.format || "jpg",
      width: asset.width || 1080,
      height: asset.height || 1080,
      bytes: asset.bytes || 0,
      createdAt: asset.createdAt.toISOString(),
      qcStatus: (asset.status as CatalogAssetItem["qcStatus"]) || "approved",
      category: asset.productCategory || "Artisan Product",
      scoreBefore: asset.scoreBefore || undefined,
      scoreAfter: asset.scoreAfter || undefined,
      scoreDelta: asset.scoreDelta || undefined,
      seoDescription: asset.seoDescription || undefined,
      dominantColors: asset.dominantColors,
      repairActions: asset.repairActions,
      tags: asset.tags,
      familyUrls,
      source: "database" as const,
    };
  });

  return {
    resources,
    totalCount,
    expression: fallbackExpr || "prisma:asset",
  };
}
