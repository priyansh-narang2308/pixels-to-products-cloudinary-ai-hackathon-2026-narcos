/**
 * Cloudinary Structured Metadata Schema Migration Script (Task 38)
 *
 * Provisions custom Structured Metadata fields directly inside the merchant's
 * Cloudinary cloud environment so cognitive audit scores, category semantics,
 * and QC status travel permanently with every asset.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface MetadataFieldDefinition {
  external_id: string;
  label: string;
  type: "string" | "integer" | "enum";
  mandatory?: boolean;
  datasource?: {
    values: Array<{ external_id: string; value: string }>;
  };
}

const LUMINA_METADATA_SCHEMA: MetadataFieldDefinition[] = [
  {
    external_id: "lumina_qc_status",
    label: "Lumina QC Status",
    type: "enum",
    datasource: {
      values: [
        { external_id: "pending", value: "Pending Analysis" },
        { external_id: "approved", value: "Commerce Approved" },
        {
          external_id: "auto_repaired",
          value: "Auto-Repaired by Cloudinary AI",
        },
        { external_id: "rejected", value: "Rejected by Quality Gate" },
      ],
    },
  },
  {
    external_id: "lumina_category",
    label: "Lumina Product Category",
    type: "string",
  },
  {
    external_id: "lumina_score_before",
    label: "Lumina Score (Raw)",
    type: "integer",
  },
  {
    external_id: "lumina_score_after",
    label: "Lumina Score (Verified)",
    type: "integer",
  },
  {
    external_id: "lumina_seo_desc",
    label: "Lumina SEO Description",
    type: "string",
  },
  {
    external_id: "lumina_dominant_colors",
    label: "Lumina Dominant Colors",
    type: "string",
  },
  {
    external_id: "lumina_repair_actions",
    label: "Lumina Applied AI Transforms",
    type: "string",
  },
];

async function setupStructuredMetadata() {
  console.log(
    "================================================================",
  );
  console.log(" LUMINA: CLOUDINARY STRUCTURED METADATA SCHEMA MIGRATION");
  console.log(
    "================================================================\n",
  );

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  console.log(`📡 Target Cloudinary Cloud: ${cloudName}\n`);

  try {
    // 1. Fetch currently provisioned metadata fields
    const listRes = await cloudinary.api.list_metadata_fields();
    const existingFields = new Set(
      (listRes.metadata_fields || []).map(
        (f: { external_id: string }) => f.external_id,
      ),
    );

    console.log(`Found ${existingFields.size} existing metadata fields.\n`);

    let createdCount = 0;
    let existingCount = 0;

    // 2. Provision each schema definition idempotently
    for (const def of LUMINA_METADATA_SCHEMA) {
      if (existingFields.has(def.external_id)) {
        console.log(
          `  ✓ [EXISTS] Field '${def.external_id}' (${def.label}) is already provisioned`,
        );
        existingCount++;
        continue;
      }

      console.log(
        `  ➕ Provisioning field '${def.external_id}' (${def.label}, type: ${def.type})...`,
      );

      try {
        const payload: Record<string, unknown> = {
          type: def.type,
          external_id: def.external_id,
          label: def.label,
          mandatory: false,
        };

        if (def.type === "enum" && def.datasource) {
          payload.datasource = def.datasource;
        }

        const res = await cloudinary.api.add_metadata_field(payload);
        console.log(`     ✅ Created field '${res.external_id}' successfully!`);
        createdCount++;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("already exists") || errMsg.includes("duplicate")) {
          console.log(`     ✓ Field '${def.external_id}' already exists.`);
          existingCount++;
        } else {
          console.warn(
            `     ⚠️ Note: Could not provision field '${def.external_id}': ${errMsg}`,
          );
        }
      }
    }

    console.log(
      "\n================================================================",
    );
    console.log(
      ` COMPLETED: ${createdCount} Created, ${existingCount} Existing / Verified`,
    );
    console.log(
      "================================================================\n",
    );
  } catch (err) {
    console.error(
      "❌ Failed to query or setup Cloudinary Structured Metadata:",
      err,
    );
    process.exit(1);
  }
}

setupStructuredMetadata();
