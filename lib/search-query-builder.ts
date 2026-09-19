
export interface CatalogSearchFilter {
  query?: string;
  status?: "pending" | "approved" | "auto_repaired" | "rejected" | "all";
  category?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  scope?: "all" | "lumina_only";
}

export function sanitizeLuceneTerm(term: string): string {
  if (!term) return "";

  return term.replace(/[+\-&|!(){}[\]^"~*?:\\/;=><]/g, " ").trim();
}

export function buildLuceneSearchExpression(
  filters: CatalogSearchFilter = {},
): string {
  const clauses: string[] = [];

  if (filters.scope !== "all") {
    clauses.push(
      "(tags:lumina* OR folder:lumina* OR public_id:lumina* OR public_id:main-sample)",
    );
  }

  if (filters.query && filters.query.trim()) {
    const cleanQuery = sanitizeLuceneTerm(filters.query);
    if (cleanQuery) {
      clauses.push(
        `(public_id:*${cleanQuery}* OR tags:*${cleanQuery}* OR metadata.lumina_category:*${cleanQuery}* OR metadata.lumina_seo_desc:*${cleanQuery}*)`,
      );
    }
  }

  if (filters.status && filters.status !== "all") {
    clauses.push(
      `(metadata.lumina_qc_status="${filters.status}" OR tags:lumina_${filters.status})`,
    );
  }

  if (
    filters.category &&
    filters.category.trim() &&
    filters.category !== "all"
  ) {
    const cleanCategory = sanitizeLuceneTerm(filters.category);
    if (cleanCategory) {
      clauses.push(
        `(metadata.lumina_category:*${cleanCategory}* OR tags:cat_${cleanCategory.toLowerCase().replace(/\s+/g, "_")}*)`,
      );
    }
  }

  if (filters.minScore !== undefined && !isNaN(filters.minScore)) {
    clauses.push(
      `metadata.lumina_score_after>=${Math.round(filters.minScore)}`,
    );
  }

  if (filters.maxScore !== undefined && !isNaN(filters.maxScore)) {
    clauses.push(
      `metadata.lumina_score_after<=${Math.round(filters.maxScore)}`,
    );
  }

  if (filters.tags && filters.tags.length > 0) {
    for (const tag of filters.tags) {
      const cleanTag = sanitizeLuceneTerm(tag);
      if (cleanTag) {
        clauses.push(`tags:${cleanTag}`);
      }
    }
  }

  return clauses.length > 0 ? clauses.join(" AND ") : "resource_type:image";
}
