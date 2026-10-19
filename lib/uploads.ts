import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";

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

export async function saveUploadedImage(file: File): Promise<string | null> {
  const ext = extensionFor(file);
  if (!ext || file.size <= 0 || file.size > MAX_BYTES) return null;
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
