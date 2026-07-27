import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production-1234567890";
const COOKIE_NAME = "auth_token";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADVERTISER";
  advertiserId?: string | null;
}

function base64urlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(escape(atob(base64)));
}

async function getCryptoKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headerStr = base64urlEncode(JSON.stringify(header));
  const payloadStr = base64urlEncode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    })
  );
  const data = new TextEncoder().encode(`${headerStr}.${payloadStr}`);

  const key = await getCryptoKey(JWT_SECRET, "sign");
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const signatureStr = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerStr, payloadStr, signatureStr] = parts;
    const data = new TextEncoder().encode(`${headerStr}.${payloadStr}`);

    const key = await getCryptoKey(JWT_SECRET, "verify");

    let base64Sig = signatureStr.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4) {
      base64Sig += "=";
    }
    const sigBinary = new Uint8Array(
      atob(base64Sig)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify("HMAC", key, sigBinary, data);
    if (!isValid) return null;

    const payload = JSON.parse(base64urlDecode(payloadStr));

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  token: string
) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !!process.env.VERCEL,
    sameSite: "lax",
    path: "/",
    expires,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
}
