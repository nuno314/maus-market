import { cookies } from "next/headers";
import { USER_COOKIE, readUserSession } from "@/lib/session";

export async function currentUser() {
  const jar = await cookies();
  return readUserSession(jar.get(USER_COOKIE)?.value);
}
