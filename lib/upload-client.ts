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

const SERVER_BODY_LIMIT = 4 * 1024 * 1024;

let clientUpload: boolean | null = null;

async function canClientUpload(): Promise<boolean> {
  if (clientUpload !== null) return clientUpload;
  const response = await fetch("/api/upload");
  const data = (await response.json().catch(() => ({}))) as { client?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || "Không tải được ảnh.");
  clientUpload = Boolean(data.client);
  return clientUpload;
}

async function putWithClient(file: File, access: "public" | "private"): Promise<string> {
  const ext = extension(file)!;
  const pathname = `uploads/${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${ext}`;
  const blob = await upload(pathname, file, {
    access,
    handleUploadUrl: "/api/upload",
    contentType: file.type || (ext === "jpg" ? "image/jpeg" : `image/${ext}`),
  });
  if (access === "private") return `/api/media?pathname=${encodeURIComponent(blob.pathname)}`;
  return blob.url;
}

async function uploadToBlob(file: File): Promise<string> {
  try {
    return await putWithClient(file, "private");
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("public store") || message.includes("public access")) {
      return putWithClient(file, "public");
    }
    throw new Error(error instanceof Error && error.message ? error.message : "Không lưu được ảnh.");
  }
}

async function uploadToServer(file: File): Promise<string> {
  const body = new FormData();
  body.set("image", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    if (response.status === 413) throw new Error(`Ảnh lớn hơn mức server nhận trực tiếp. Mỗi ảnh tối đa ${MAX_IMAGE_MB} MB khi Blob đã gắn token.`);
    throw new Error(data.error || "Không tải được ảnh.");
  }
  return data.url;
}

export async function uploadProductImage(file: File): Promise<string> {
  const problem = imageFileError(file);
  if (problem) throw new Error(problem);
  if (file.size > SERVER_BODY_LIMIT && (await canClientUpload())) return uploadToBlob(file);
  return uploadToServer(file);
}
