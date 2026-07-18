import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "qg_session";
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Helper to compute HMAC SHA-256 using the Web Crypto API (supported in Node & Edge)
 */
async function computeHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "default-admin-password";
}

export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  const payload = `session:${expiry}`;
  const hmac = await computeHmac(payload, getSecret());
  return `${payload}:${hmac}`;
}

export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;

    const [, expiryStr, providedHmac] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry
    if (Date.now() > expiry) return false;

    // Verify HMAC
    const payload = `session:${expiryStr}`;
    const expectedHmac = await computeHmac(payload, getSecret());

    // Simple time-safe comparison helper for Edge runtime
    if (providedHmac.length !== expectedHmac.length) return false;
    let result = 0;
    for (let i = 0; i < providedHmac.length; i++) {
      result |= providedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_EXPIRY_HOURS * 60 * 60,
    path: "/",
  });
}

export async function isAuthenticatedFromRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return validateSessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return validateSessionToken(token);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
