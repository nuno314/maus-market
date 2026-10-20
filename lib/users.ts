import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { users } from "@/lib/schema";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

export function isValidPassword(value: string) {
  return value.length >= 6 && value.length <= 64;
}

export async function findUserByUsername(username: string) {
  const db = await getDb();
  return (await db.select().from(users).where(eq(users.username, username)).get()) ?? null;
}

export async function createUser(username: string, password: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db
    .insert(users)
    .values({
      username,
      passwordHash: await hashPassword(password),
      createdAt: now,
    })
    .run();
  return findUserByUsername(username);
}
