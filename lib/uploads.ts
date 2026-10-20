import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { put, type PutBlobResult } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionFor(file: File): string | null {
  if (MIME_EXT[file.type]) return MIME_EXT[file.type];
  const match = file.name.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
  if (!match) return null;
  return match[1] === "jpeg" ? "jpg" : match[1]!;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function contentTypeFor(file: File, ext: string): string {
  if (MIME_EXT[file.type]) return file.type;
  return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
}

function blobDetail(error: unknown): string {
  if (!(error instanceof Error)) return "";
  return error.message.replace(/vercel_blob_\S+/gi, "").trim();
}

function isPrivateStoreError(error: unknown): boolean {
  return blobDetail(error).toLowerCase().includes("private store");
}

async function putBlob(name: string, body: Buffer, contentType: string, access: "public" | "private"): Promise<PutBlobResult> {
  return put(`uploads/${name}`, body, { access, contentType });
}

export async function saveUploadedImage(file: File): Promise<string | null> {
  const ext = extensionFor(file);
  if (!ext || file.size <= 0 || file.size > MAX_BYTES) return null;
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
  if (hasBlob) {
    const body = Buffer.from(await file.arrayBuffer());
    const contentType = contentTypeFor(file, ext);
    try {
      const blob = await putBlob(name, body, contentType, "public");
      return blob.url;
    } catch (error) {
      if (!isPrivateStoreError(error)) {
        const detail = blobDetail(error);
        throw new UploadError(detail ? `Không lưu được ảnh lên Blob. ${detail}` : "Không lưu được ảnh lên Blob.");
      }
      try {
        const blob = await putBlob(name, body, contentType, "private");
        return `/api/media?pathname=${encodeURIComponent(blob.pathname)}`;
      } catch (privateError) {
        const detail = blobDetail(privateError);
        throw new UploadError(detail ? `Không lưu được ảnh lên Blob. ${detail}` : "Không lưu được ảnh lên Blob.");
      }
    }
  }
  if (process.env.VERCEL) {
    throw new UploadError(
      "Vercel không lưu được file ảnh. Vào Storage, tạo Blob store, gắn vào project rồi deploy lại.",
    );
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new UploadError("Không lưu được ảnh trên máy chủ.");
  }
  return `/uploads/${name}`;
}
