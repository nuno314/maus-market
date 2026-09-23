import { getListingsByIds } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids") ?? "";
  const parsed = ids
    .split(",")
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 50);
  return Response.json(getListingsByIds(parsed));
}
