"use server";
// Login/logout server actions (docs/specs/02-design.md rule 6).
// Task 3 scope: the success path. Task 5 hardens the failure message
// timing; task 6 adds the lockout; task 7 adds the ?next return path.
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { createSession, destroySession } from "@/app/lib/session";
import { homeOf } from "@/app/lib/roles";
import { isSafeNext } from "@/app/lib/safe-next";
import { GENERIC_LOGIN_ERROR } from "@/app/lib/messages";

export type LoginState = { error?: string } | undefined;

// A real bcrypt hash of a random string nobody knows. When the email is
// unknown (or the account is deactivated or locked) we still run
// bcrypt.compare against it, so every failure path costs the same time and
// the page can never reveal whether an account exists or is locked
// (AC-03, design rule 1).
const DUMMY_HASH = "$2b$10$f2Jz1NAgKaAW2HkbCHsTqOhQnYUpB9ZGz.nwep7/3/YpasxfcpCwq";

// AC-04, design rule 2: five consecutive wrong passwords, then a 30-minute
// wait. Auto-unlock only — there is no Admin unlock screen (interview).
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const now = Date.now();
  // A lock still in the future behaves exactly like a deactivated account:
  // usable stays null, the compare runs against the dummy hash, and the
  // answer is the same generic message (rule 2: never reveal the lock).
  const locked = !!user?.lockedUntil && user.lockedUntil.getTime() > now;
  const usable = user && user.active && !locked ? user : null;
  const passwordOk = await bcrypt.compare(
    password,
    usable ? usable.passwordHash : DUMMY_HASH,
  );
  if (!usable || !passwordOk) {
    if (usable) {
      // Wrong password on a usable account: strike 5 locks it for 30 minutes.
      const failedAttempts = usable.failedAttempts + 1;
      await prisma.user.update({
        where: { id: usable.id },
        data: {
          failedAttempts,
          lockedUntil:
            failedAttempts >= MAX_ATTEMPTS
              ? new Date(now + LOCK_MINUTES * 60_000)
              : usable.lockedUntil,
        },
      });
    }
    return { error: GENERIC_LOGIN_ERROR };
  }

  // Correct password and not locked: the counter starts fresh (rule 2),
  // also clearing a lock that has already expired.
  if (usable.failedAttempts !== 0 || usable.lockedUntil !== null) {
    await prisma.user.update({
      where: { id: usable.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }
  await createSession(usable.id, usable.role);
  // AC-05/design rule 5: honour the wanted page only if it is an internal
  // path; anything else (e.g. ?next=https://evil.example) goes to the home.
  const next = String(formData.get("next") ?? "");
  if (isSafeNext(next)) {
    redirect(next);
  }
  redirect(homeOf(usable.role)); // AC-01/AC-02: land on the role's own home
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
