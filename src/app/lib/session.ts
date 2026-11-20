// Cookie handling around the signed token. cookies() is async in Next 16 —
// always awaited. Only this file touches cookies (docs/specs/02-design.md §5).
import { cookies } from "next/headers";
import {
  SESSION_DURATION_MS,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from "./session-token";

export const SESSION_COOKIE = "session";

export async function createSession(userId: number, role: string): Promise<void> {
  const exp = Date.now() + SESSION_DURATION_MS;
  const token = signSession({ uid: userId, role, exp });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable by page JavaScript (AC-13)
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production", // localhost dev over http
    expires: new Date(exp), // 8 hours (U6)
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
