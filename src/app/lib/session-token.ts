// The signed session text (docs/specs/02-design.md rule 3):
// base64url(JSON payload) + "." + HMAC-SHA256, key in SESSION_SECRET.
// Pure functions only (no next/headers) so the crypto can be unit-checked
// with plain node. 8 hours, decided in the interview.
import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  uid: number; // user id — the only user data in the cookie (design rule 3)
  role: string;
  exp: number; // epoch ms; login time + 8 hours
};

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is missing from .env — see docs/specs/02-design.md §3");
  }
  return s;
}

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Valid and unexpired → payload; anything else (tampered, malformed,
 *  expired, secret rotated) → null, treated as logged out. */
export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (
      typeof p.uid !== "number" ||
      typeof p.role !== "string" ||
      typeof p.exp !== "number"
    ) {
      return null;
    }
    if (p.exp <= Date.now()) return null; // U6/AC-08: 8-hour session dies here
    return p;
  } catch {
    return null;
  }
}
