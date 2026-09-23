import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "maus_session";

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
