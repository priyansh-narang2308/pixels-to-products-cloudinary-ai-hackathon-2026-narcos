
import { revalidateTag, revalidatePath } from "next/cache";

export function invalidateCatalogCache(publicId?: string): void {
  try {

    revalidateTag("catalog", "default");
    revalidateTag("analytics", "default");
    revalidateTag("recent-assets", "default");

    if (publicId) {
      revalidateTag(`asset-${publicId}`, "default");
    }

    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/dashboard");
    revalidatePath("/upload");
  } catch (err) {

    console.debug(
      "[Cache Invalidation] Non-critical cache refresh skipped:",
      err,
    );
  }
}
