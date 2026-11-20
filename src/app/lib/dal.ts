// The single door every protected page and action walks through
// (docs/specs/02-design.md rule 4). verifySession re-reads the user from
// the database, so deactivation and lockout take effect immediately.
// (No 'server-only' import: that package is not in the pinned dependencies;
// these helpers are only ever imported by server components/actions.)
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { readSession } from "./session";
import { homeOf, type Role } from "./roles";

export const verifySession = cache(async (): Promise<User | null> => {
  const payload = await readSession();
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user || !user.active) return null;
  return user;
});

/** Logged-in user or off to /login, carrying the wanted page as ?next (AC-05). */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await verifySession();
  if (!user) {
    redirect(
      nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login",
    );
  }
  return user;
}

/** Right role or bounce to the user's own home (U3/AC-06). */
export async function requireRole(
  role: Role,
  nextPath?: string,
): Promise<User> {
  const user = await requireUser(nextPath);
  if (user.role !== role) redirect(homeOf(user.role as Role));
  return user;
}
