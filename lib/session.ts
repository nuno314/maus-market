import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "maus_session";
export const USER_COOKIE = "maus_user";

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || "maus-collect-dev-secret-change-me",
  );
}

export async function signSession() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function signUserSession(userId: number, username: string) {
  return new SignJWT({ role: "user", sub: String(userId), username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function readUserSession(token: string | undefined): Promise<{ id: number; username: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (payload.role !== "user" || !Number.isInteger(id) || id < 1 || typeof payload.username !== "string") return null;
    return { id, username: payload.username };
  } catch {
    return null;
  }
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "maus-admin";
}

export function credentialsMatch(username: string, password: string) {
  return username === adminUsername() && password === adminPassword();
}
