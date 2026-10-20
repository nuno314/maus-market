import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession } from "@/lib/session";
import { UploadError, saveUploadedImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return Response.json({ error: "Cần đăng nhập admin." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size <= 0) {
    return Response.json({ error: "Chọn một file ảnh." }, { status: 400 });
  }
  try {
    const url = await saveUploadedImage(file);
    if (!url) return Response.json({ error: "Ảnh cần là JPG, PNG, WEBP hoặc GIF, tối đa 5 MB." }, { status: 400 });
    return Response.json({ url });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
