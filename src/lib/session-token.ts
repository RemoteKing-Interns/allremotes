// Signed admin session tokens (HMAC-SHA256, base64url payload.signature).
// Works in both Node (API routes) and edge middleware via Web Crypto.

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.CRON_SECRET ||
    process.env.PII_ENCRYPTION_KEY ||
    "allremotes-dev-only-secret"
  );
}

function b64url(data: string | ArrayBuffer): string {
  let bin: string;
  if (typeof data === "string") {
    bin = data;
  } else {
    bin = String.fromCharCode(...new Uint8Array(data));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

export interface SessionPayload {
  email: string;
  role: string;
  permissions?: string[];
  exp: number;
}

export async function mintSessionToken(
  email: string,
  role: string,
  permissions: string[] = [],
  ttlSeconds = 60 * 60 * 12
): Promise<string> {
  const payload = b64url(JSON.stringify({ email, role, permissions, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const p = JSON.parse(b64urlDecode(payload)) as SessionPayload;
    if (!p.email || !p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

// Extract + verify from a Request: admin_session cookie (browser) or Bearer token.
export async function getAdminSession(req: Request): Promise<SessionPayload | null> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const session = await verifySessionToken(m?.[1] || bearer);
  if (!session || (session.role !== "admin" && !(session.permissions || []).includes("*"))) return null;
  return session;
}
