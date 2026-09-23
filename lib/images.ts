export function cardImageSrc(url: string | null | undefined, size: "low" | "high" = "low"): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(trimmed)) return trimmed;
  return `${trimmed.replace(/\/$/, "")}/${size}.webp`;
}
