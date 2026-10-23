import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "@/lib/images";
import { SESSION_COOKIE, readSession } from "@/lib/session";
import { UploadError, saveUploadedImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function adminSession() {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function GET() {
  const session = await adminSession();
  if (!session) return Response.json({ error: "Cần đăng nhập admin." }, { status: 401 });
  return Response.json({
    client: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as HandleUploadBody;
    if (body.type === "blob.generate-client-token") {
      const session = await adminSession();
      if (!session) return Response.json({ error: "Cần đăng nhập admin." }, { status: 401 });
    }
    try {
      const json = await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        }),
      });
      return Response.json(json);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không tải được ảnh.";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  const session = await adminSession();
  if (!session) return Response.json({ error: "Cần đăng nhập admin." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size <= 0) {
    return Response.json({ error: "Chọn một file ảnh." }, { status: 400 });
  }
  try {
    const url = await saveUploadedImage(file);
    if (!url) {
      return Response.json(
        { error: `Ảnh cần là JPG, PNG, WEBP hoặc GIF, tối đa ${MAX_IMAGE_MB} MB.` },
        { status: 400 },
      );
    }
    return Response.json({ url });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
