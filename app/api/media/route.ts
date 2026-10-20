import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

const PATHNAME = /^uploads\/[A-Za-z0-9._-]+$/;

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("pathname") ?? "";
  if (!PATHNAME.test(pathname)) return new Response("Not found", { status: 404 });
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return new Response("Not found", { status: 404 });
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
