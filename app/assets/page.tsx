"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { CatalogAssetItem } from "@/lib/cloudinary-search";

const CATEGORIES = [
  "All",
  "Handwoven Saree",
  "Textiles",
  "Brass Handicrafts",
  "Pottery & Ceramics",
  "Artisan Leather",
  "Jewelry",
];

const STATUS_FILTERS = [
  { id: "all", label: "All Items" },
  { id: "approved", label: "Approved (≥70)" },
  { id: "auto_repaired", label: "Auto-Repaired" },
  { id: "rejected", label: "Rejected" },
];

export default function CatalogBrowserPage() {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [minScore, setMinScore] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [resources, setResources] = React.useState<CatalogAssetItem[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);

  const fetchCatalog = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (minScore > 0) params.set("minScore", String(minScore));
      params.set("limit", "36");

      const res = await fetch(`/api/catalog/search?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setResources(data.resources || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedCategory, minScore]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Marketplace Inventory & Catalog
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Faceted discovery powered by Cloudinary Lucene Search Index with
            dual-layer PostgreSQL backing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCatalog}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Index</span>
          </Button>

          <Link href="/upload">
            <Button size="sm" className="gap-2 font-medium">
              <Sparkles className="size-3.5" />
              <span>Compile New Asset</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6 lg:border-r lg:border-border/60 lg:pr-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="size-4" />
            <span>Catalog Filters</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search tags, category, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              QC Compliance Status
            </label>
            <div className="flex flex-col gap-1">
              {STATUS_FILTERS.map((s) => {
                const isActive = selectedStatus === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStatus(s.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-left transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Artisan Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Badge
                    key={cat}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={`cursor-pointer text-[11px] transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : "hover:bg-accent"
                    }`}
                  >
                    {cat}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground">
                Minimum Quality Score
              </label>
              <span className="font-mono font-bold text-primary">
                {minScore}+
              </span>
            </div>
            <Slider
              value={[minScore]}
              onValueChange={(vals) =>
                setMinScore(Array.isArray(vals) ? vals[0] : Number(vals) || 0)
              }
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>All (0)</span>
              <span>Gate (70)</span>
              <span>Elite (90+)</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("all");
              setSelectedCategory("All");
              setMinScore(0);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All Filters
          </Button>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
            <div>
              Showing{" "}
              <span className="font-bold text-foreground">
                {resources.length}
              </span>{" "}
              of <span className="font-bold text-foreground">{totalCount}</span>{" "}
              assets in catalog
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloudinary Lucene Index Active</span>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl border border-border/50 bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && resources.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center space-y-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Layers className="size-7" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="font-semibold text-base text-foreground">
                  No catalog items found
                </h3>
                <p className="text-xs text-muted-foreground">
                  Try broadening your search query, lowering the minimum score,
                  or upload a new photo.
                </p>
              </div>
              <Link href="/upload">
                <Button size="sm" className="gap-2 mt-2">
                  <Sparkles className="size-3.5" />
                  <span>Upload & Compile Media</span>
                </Button>
              </Link>
            </div>
          )}

          {!loading && resources.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((item) => {
                const isApproved =
                  item.qcStatus === "approved" ||
                  item.qcStatus === "auto_repaired";
                const isRejected = item.qcStatus === "rejected";

                return (
                  <Card
                    key={item.publicId}
                    className="group overflow-hidden border-border/70 bg-card/70 shadow-md backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted/40 border-b border-border/50">
                      <Image
                        src={item.familyUrls?.hero || item.secureUrl}
                        alt={item.category || "Asset"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute top-3 left-3">
                        <Badge
                          variant="secondary"
                          className={`border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md shadow-xs ${
                            isApproved
                              ? "border-emerald-500/40 bg-background/85 text-emerald-600 dark:text-emerald-400"
                              : isRejected
                                ? "border-destructive/40 bg-background/85 text-destructive"
                                : "border-amber-500/40 bg-background/85 text-amber-500"
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="mr-1 size-3 text-emerald-500" />
                          ) : isRejected ? (
                            <XCircle className="mr-1 size-3 text-destructive" />
                          ) : (
                            <Clock className="mr-1 size-3 text-amber-500" />
                          )}
                          <span className="capitalize">
                            {item.qcStatus.replace("_", " ")}
                          </span>
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        {item.scoreDelta && item.scoreDelta > 0 && (
                          <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-1.5 shadow-xs">
                            +{item.scoreDelta}
                          </Badge>
                        )}
                        <Badge
                          className={`font-mono text-xs font-bold shadow-xs ${
                            (item.scoreAfter || 0) >= 80
                              ? "bg-emerald-600 text-white"
                              : (item.scoreAfter || 0) >= 65
                                ? "bg-amber-600 text-white"
                                : "bg-rose-600 text-white"
                          }`}
                        >
                          {item.scoreAfter || item.scoreBefore || "—"}/100
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {item.format?.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-heading text-sm font-semibold text-foreground truncate mt-0.5">
                          {item.publicId.split("/").pop()}
                        </h4>
                        {item.seoDescription && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                            {item.seoDescription}
                          </p>
                        )}
                      </div>

                      {item.repairActions && item.repairActions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.repairActions.slice(0, 2).map((act, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
                            >
                              {act.split(":")[0]}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                        <Link
                          href={`/assets/${encodeURIComponent(item.id || item.publicId)}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 text-xs font-medium"
                          >
                            <Eye className="size-3.5 text-primary" />
                            <span>Inspect Asset</span>
                          </Button>
                        </Link>

                        <a
                          href={item.familyUrls?.hero || item.secureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Open Cloudinary CDN"
                            className="border border-border/60 hover:bg-accent"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
