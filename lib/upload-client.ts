import { upload } from "@vercel/blob/client";
import { MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "@/lib/images";

function extension(file: File): string | null {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  const match = file.name.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
  if (!match) return null;
  return match[1] === "jpeg" ? "jpg" : match[1]!;
}

export function imageFileError(file: File): string | null {
  if (!extension(file)) return "Ảnh cần là JPG, PNG, WEBP hoặc GIF.";
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return `Mỗi ảnh tối đa ${MAX_IMAGE_MB} MB.`;
  return null;
}

let blobMode: boolean | null = null;

async function usesBlob(): Promise<boolean> {
  if (blobMode !== null) return blobMode;
  const response = await fetch("/api/upload");
  const data = (await response.json().catch(() => ({}))) as { blob?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || "Không tải được ảnh.");
  blobMode = Boolean(data.blob);
  return blobMode;
}

async function uploadToBlob(file: File, access: "public" | "private" = "public"): Promise<string> {
  const ext = extension(file)!;
  const pathname = `uploads/${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${ext}`;
  try {
    const blob = await upload(pathname, file, {
      access,
      handleUploadUrl: "/api/upload",
      contentType: file.type || (ext === "jpg" ? "image/jpeg" : `image/${ext}`),
    });
    if (access === "private") return `/api/media?pathname=${encodeURIComponent(blob.pathname)}`;
    return blob.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (access === "public" && message.toLowerCase().includes("private store")) {
      return uploadToBlob(file, "private");
    }
    throw new Error(message || "Không tải được ảnh.");
  }
}

async function uploadToServer(file: File): Promise<string> {
  const body = new FormData();
  body.set("image", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error || "Không tải được ảnh.");
  return data.url;
}

export async function uploadProductImage(file: File): Promise<string> {
  const problem = imageFileError(file);
  if (problem) throw new Error(problem);
  if (await usesBlob()) return uploadToBlob(file);
  return uploadToServer(file);
}
