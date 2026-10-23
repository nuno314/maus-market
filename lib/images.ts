export const MAX_PRODUCT_IMAGES = 8;
export const MAX_IMAGE_MB = 15;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

export function parseStoredImages(raw: string | null | undefined, fallback = ""): string[] {
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const urls = parsed
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim());
        if (urls.length > 0) return urls.slice(0, MAX_PRODUCT_IMAGES);
      }
    } catch {
      // Older rows keep a single image_url.
    }
  }
  return fallback ? [fallback] : [];
}

export function cardImageSrc(url: string | null | undefined, size: "low" | "high" = "low"): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:") || trimmed.startsWith("/")) return trimmed;
  if (/\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(trimmed)) return trimmed;
  return `${trimmed.replace(/\/$/, "")}/${size}.webp`;
}
