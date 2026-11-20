# Login – Design

> **This file answers:** How is the app put together? (data, rules, screens,
> where the code lives)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file. (Master: `01-requirements.md`, stories U1–U10, checks AC-01–AC-13.)

## 1. Tables

One table is enough for login. The brief says "signed session cookie", so the
session lives in the cookie, not in a Session table — the server only keeps
the user rows and re-reads the user on every page, which is what makes
deactivation and lockout take effect immediately.

### `User` – one row per person who can log in

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `name` | text | yes | Full name, shown in the header |
| `icNo` | text | yes | Identity card number, format `xx-xxxxxx` (2 digits, hyphen, 6 digits), unique |
| `email` | text | yes | Work email, always lower-case, unique, ends `@budiman.com`. Used to log in |
| `passwordHash` | text | yes | bcrypt hash from bcryptjs. Never the plain password |
| `role` | text | yes | One of `EMPLOYEE`, `SUPERVISOR`, `HR`, `ADMIN` |
| `division` | text | yes | One of the fixed divisions in Reference A. Needed later to pick supervisors; set from login onwards |
| `designation` | text | yes | Job title; must belong to the chosen division (Reference A) |
| `active` | boolean | yes, default `true` | Deactivated accounts are refused at login with the generic message (U10). Never delete rows |
| `failedAttempts` | number | yes, default `0` | Wrong passwords in a row. Reset to 0 on a successful login (U7) |
| `lockedUntil` | date | no | While this is in the future, the account is locked (U7) |
| `createdAt` | date | auto | Set when the row is created |

## 2. Business rules

1. **Login.** Find the user by lower-cased email. Then — even if no such
   email exists — do a bcrypt compare (against a stored or throwaway hash) so
   the two failure paths take about the same time, and always answer with the
   one message "Email or password is incorrect". Never say which part failed,
   never reveal that an account exists, is deactivated, or is locked (AC-03).
2. **Lockout (U7).** Each wrong password raises `failedAttempts`. At 5, set
   `lockedUntil = now + 30 minutes`. While locked, or while `active` is false,
   a correct password is refused with the same generic message. When
   `lockedUntil` is in the past the next correct login succeeds and resets
   `failedAttempts` to 0. There is no Admin unlock (decided in interview).
3. **Session (U5, U6, AC-08).** On success, set one cookie named `session`:
   an HMAC-signed text holding `userId`, `role`, and `expiresAt`
   (login time + 8 hours), signed with `SESSION_SECRET` from `.env` using
   Node's built-in `node:crypto` — no extra library (package versions are
   pinned; adding `jose`/`iron-session` would need approval first). Cookie
   options: `httpOnly`, `sameSite: 'lax'`, `path: '/'`, `secure` when not
   localhost, `expires` = the same 8 hours. A tampered cookie fails its
   signature check and counts as logged out.
4. **Who checks, where (U3, U4).** Every protected page calls
   `verifySession()` (from `src/app/lib/dal.ts`) before rendering anything:
   no valid session → redirect to `/login`; valid session but wrong role for
   that page → redirect to the user's own home. Every server action calls it
   again before touching data. Layouts and hidden links are decoration only —
   a layout check does not re-run on client navigation, so nothing relies on
   it. No `proxy.ts` file (Next 16's renamed middleware): on a laptop demo the
   per-page check is enough, and it is the one that counts anyway.
5. **Return-after-login (U4, AC-05).** The redirect to `/login` carries the
   wanted page as `?next=/hr`. After a successful login the user goes to
   `next` — but only if it starts with `/` and not `//` (an internal path),
   otherwise to the role's home. This blocks open-redirect abuse.
6. **Login actions are server actions.** The login form, the logout button,
   and every Admin user action run as server actions (`'use server'`), the
   Next 16 way to mutate; no API routes for login.
7. **Admin user management (U10, AC-10–AC-12).** Only `ADMIN` may open
   `/admin/users` or call its actions — checked inside each action, not just
   on the page. Server-side validation on every submit: email lower-cased,
   unique, `@budiman.com`; `icNo` unique and matching `xx-xxxxxx`; role,
   division and designation from Reference A only, designation belonging to
   the division; password at least 8 characters (**my call** — the brief sets
   no password policy). Reset writes a fresh bcrypt hash and clears the
   failed-attempt fields. Deactivate/reactivate flips `active`; rows are
   never deleted. The Admin cannot deactivate or reset their own account
   (**my call** — prevents locking the last Admin out).
8. **Seeding (U8, AC-01).** `prisma/seed.ts` creates exactly the six demo
   users of Reference B, password `password123` bcrypt-hashed, `active: true`,
   zero failed attempts. Re-running the seed upserts by email, so it cannot
   make duplicates.
9. **Nothing secret in logs or pages.** Never log passwords or the full
   session cookie; never return `passwordHash` to a page or the client.
   Pages receive only the fields they show (name, role, email).

## 3. Technology

Fixed by the brief (section 7.1) — nothing added, nothing upgraded:

| Part | Choice | In plain words |
|------|--------|----------------|
| Web framework | Next.js 16 + TypeScript, App Router | Pages and server code in one project; server actions for login/logout/admin changes |
| Database | SQLite via Prisma | One file, no server to install; `prisma/schema.prisma` holds the `User` table |
| Styling | Tailwind CSS | Classes sit in the components |
| Password hashing | bcryptjs | Hash on save, compare on login |
| Session | Signed cookie via `node:crypto` HMAC + `next/headers` `cookies()` (which is async in Next 16) | Server signs a small payload with `SESSION_SECRET`; only the server can read/verify it |
| Secret | `SESSION_SECRET` in `.env` (git-ignored); `DATABASE_URL` too | Keeps the signing key out of the code |

## 4. Screens (routes)

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/login` | Anyone | Email + password form; one generic error line; the "Demo data" box with the six emails and `password123` (U9). Already-signed-in visitors go to their home | To do |
| `/` | Anyone | The old placeholder page goes away: signed in → redirect to that role's home; not signed in → `/login` | To do |
| `/employee` | Employee | Header (name, division, Log out button) + placeholder card saying "Employee home". Real content comes with the leave spec | To do |
| `/supervisor` | Supervisor | Same shape, supervisor's placeholder | To do |
| `/hr` | HR | Same shape, HR's placeholder | To do |
| `/admin` | Admin | Admin placeholder + a link to the users page | To do |
| `/admin/users` | Admin | Table of users (name, email, role, division, active, locked) with Add user, Reset password, Deactivate/Reactivate; confirmation before each action and a success message afterwards (brief rule 7) | To do |

Logout is not a page: a Log out button posts the `logout` server action,
which deletes the cookie and redirects to `/login`.

## 5. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The `User` model from section 1 |
| `prisma/seed.ts` | The six demo users of Reference B, hashed passwords |
| `.env` (git-ignored) | `DATABASE_URL`, `SESSION_SECRET` |
| `src/app/layout.tsx` | Root layout: renders a small server-only header (name + Log out) only when `verifySession()` returns a user |
| `src/app/page.tsx` | Replaces the placeholder: redirect per rule 4 |
| `src/app/login/page.tsx` | Login screen + demo box (server component) |
| `src/app/employee/page.tsx`, `supervisor/`, `hr/`, `admin/page.tsx` | Role homes: first line calls `verifySession()` and the role check |
| `src/app/admin/users/page.tsx` | User table + admin buttons |
| `src/app/lib/session.ts` | `'server-only'`: sign/verify the cookie, `createSession`, `destroySession` — the only code that touches `cookies()` |
| `src/app/lib/dal.ts` | `'server-only'`: `verifySession()` (React `cache`) and `requireRole(role)` used by pages and all actions |
| `src/app/lib/validation.ts` | Shared field checks: email, IC pattern, role/division/designation lists |
| `src/app/actions/auth.ts` | `'use server'`: `login` (lockout logic, rules 1–3) and `logout` |
| `src/app/actions/users.ts` | `'use server'`: add user, reset password, set active — each starts with `requireRole('ADMIN')` |
| `src/components/` | `LoginForm`, `DemoAccountsBox`, `Header`, `UsersTable`, `AddUserForm` |

## 6. Security (in plain words)

OWASP Top 10, mapped to where each defence lives:

- **Access control (A01).** The role check runs on the server in
  `verifySession()`/`requireRole()` inside every page *and* again inside every
  server action — hiding a button is never the protection. Deactivated and
  locked accounts fail at the door; Admin actions check `ADMIN` per action.
- **Authentication failures (A07).** One generic message; bcryptjs hashes
  with constant compare; 5 strikes → 30-minute lockout; 8-hour cookie life;
  logout deletes the cookie.
- **Crypto (A02).** Signing key in `.env`, never committed; the cookie payload
  holds only id/role/expiry; TLS note: `secure` flag turns on outside localhost.
- **Injection (A03).** All reads through Prisma's parameterised queries; no
  hand-built SQL.
- **Open redirect (A01/A03 adjacent).** `?next=` accepted only if it is an
  internal path (rule 5).
- **Logging (A09).** Emails yes, passwords/cookies never.
- **Server-validated forms (A05).** Admin user fields are re-checked on the
  server even though the form checks them too.

## 7. Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install the pinned dependencies |
| `npm run dev` | Start the app at http://localhost:3000 |
| `npx prisma migrate dev --name login` | Create/apply the SQLite schema (`User` table) |
| `npx prisma db seed` | Load the six demo users |
| `npm run lint` | Check the code |

---

# Reference

## Reference A. Fixed lists (from the brief, section 7.2)

- **Roles:** `EMPLOYEE`, `SUPERVISOR`, `HR`, `ADMIN` — one per user
- **Divisions and their designations:**
  - **Finance:** Finance Manager, Accountant, Accounts Clerk
  - **Human Resources:** HR Manager, HR Officer, HR Assistant
  - **Information Technology:** IT Manager, Software Developer, IT Support Officer
  - **Operations:** Operations Manager, Operations Supervisor, Operations Executive
  - **Marketing:** Marketing Manager, Marketing Executive, Marketing Assistant
- **Email domain:** `@budiman.com`. **IC format:** `xx-xxxxxx`. **Minimum password length:** 8 (my call)

## Reference B. Demo data (seeded; all passwords `password123`, hashed)

| Email | Name | IC No. | Role | Division | Designation |
|-------|------|--------|------|----------|-------------|
| `employee-1@budiman.com` | Employee 1 | 00-148888 | Employee | Finance | Accounts Clerk |
| `supervisor-1@budiman.com` | Supervisor 1 | 00-157777 | Supervisor | Finance | Finance Manager |
| `supervisor-2@budiman.com` | Supervisor 2 | 00-166666 | Supervisor | Finance | Accountant |
| `hr-1@budiman.com` | HR 1 | 00-175555 | HR | Human Resources | HR Officer |
| `hr-2@budiman.com` | HR 2 | 00-184444 | HR | Human Resources | HR Officer |
| `admin@budiman.com` | Admin | 00-193333 | Admin | Admin | Admin Manager |

(The `Admin` division/designation is not in Reference A's tables; the brief's
demo list names it, so the seed uses those values while the Admin form still
only offers Reference A's divisions to ordinary users. **My call**, flag it if
you disagree.)
