/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { UploadCloud, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UploadResultPayload {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  originalFilename: string;
}

interface SecureUploaderProps {
  onUploadSuccess?: (result: UploadResultPayload) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  className?: string;
}

export function SecureUploader({
  onUploadSuccess,
  onUploadError,
  folder = "lumina/uploads",
  className = "",
}: SecureUploaderProps) {
  const [uploadedAsset, setUploadedAsset] =
    React.useState<UploadResultPayload | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    setIsProcessing(false);
    if (!results.info || typeof results.info === "string") return;

    const info = results.info;
    const payload: UploadResultPayload = {
      publicId: info.public_id,
      secureUrl: info.secure_url,
      width: info.width || 1080,
      height: info.height || 1080,
      format: info.format || "jpg",
      bytes: info.bytes || 0,
      originalFilename: info.original_filename || "product_photo",
    };

    setUploadedAsset(payload);
    onUploadSuccess?.(payload);
  };

  const handleError = (error: unknown) => {
    setIsProcessing(false);
    const errorMessage =
      typeof error === "string"
        ? error
        : "Upload failed. Please check network.";
    console.error("[Lumina Upload Error]:", error);
    onUploadError?.(errorMessage);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <CldUploadWidget
        signatureEndpoint="/api/sign-cloudinary-params"
        options={{
          folder,
          maxFiles: 1,
          resourceType: "image",
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          maxFileSize: 10_000_000, // 10MB limit
          sources: ["local", "url", "camera"],
          multiple: false,
          styles: {
            palette: {
              window: "#171310",
              windowBorder: "#4A3B32",
              tabIcon: "#E2A96B",
              menuIcons: "#E2A96B",
              textDark: "#171310",
              textLight: "#F5EFEB",
              link: "#E2A96B",
              action: "#E2A96B",
              inactiveTabIcon: "#8A7968",
              error: "#E05252",
              inProgress: "#E2A96B",
              complete: "#22C55E",
              sourceBg: "#231D19",
            },
          },
        }}
        onSuccess={handleSuccess}
        onError={handleError}
        onOpen={() => setIsProcessing(true)}
      >
        {({ open }) => (
          <div
            onClick={() => open()}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-card/60 p-8 text-center transition-all duration-200 hover:border-primary/60 hover:bg-card/90 hover:shadow-lg sm:p-12"
          >
            <div className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            {uploadedAsset ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative size-24 overflow-hidden rounded-xl border border-border shadow-md">
                  <img
                    src={uploadedAsset.secureUrl}
                    alt={uploadedAsset.originalFilename}
                    className="size-full object-cover"
                  />
                  <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-qc-pass text-white shadow-xs">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Photo Ingested Successfully
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {uploadedAsset.publicId} · {uploadedAsset.width}×
                    {uploadedAsset.height} ·{" "}
                    {(uploadedAsset.bytes / 1024).toFixed(0)} KB
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-(--qc-pass)/30 bg-(--qc-pass)/10 px-3 py-1 text-xs font-medium text-qc-pass">
                  <Sparkles className="size-3.5" />
                  Signed HMAC Ingestion Verified
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Click to replace with a different product photo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background/80 text-primary shadow-xs transition-transform duration-200 group-hover:scale-105">
                  <UploadCloud className="size-7" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Drop your raw smartphone product photo here
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports JPG, PNG, WEBP up to 10MB · Signed HMAC
                    direct-to-cloud upload
                  </p>
                </div>

                <div className="mt-2 inline-flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="pointer-events-none rounded-full border-primary/40 bg-primary/10 text-xs font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Select Photo
                    <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CldUploadWidget>
    </div>
  );
}
