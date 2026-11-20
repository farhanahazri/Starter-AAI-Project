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
| `/login` | Anyone | Card with a mint "STAFF LOGIN" band holding the email + password form and one generic error line; the "Demo data" box with the six emails and `password123` below it (U9). Already-signed-in visitors go to their home | Done |
| `/` | Anyone | The old placeholder page goes away: signed in → redirect to that role's home; not signed in → `/login` | Done |
| `/employee` | Employee | Header (name, Log out button) + card with a mint "EMPLOYEE HOME" band and placeholder text. Real content comes with the leave spec | Done |
| `/supervisor` | Supervisor | Same shape, "SUPERVISOR HOME" band | Done |
| `/hr` | HR | Same shape, "HR HOME" band | Done |
| `/admin` | Admin | "ADMIN HOME" band + a link to the users page | Done |
| `/admin/users` | Admin | Table of users (name, email, role, division, active, locked) with Add user, Reset password, Deactivate/Reactivate; confirmation before each action and a success message afterwards (brief rule 7) | Done |

Logout is not a page: a Log out button posts the `logout` server action,
which deletes the cookie and redirects to `/login`.

### Look and feel (visual reference: `src/IMAGE LOGIN/OIP.webp`)

Agreed 2026-11-20: the login page and the role homes follow the attached
reference picture — a dark navy page with soft teal glows and a centered
translucent card under a mint-teal header band. This is **appearance only**:
behaviour is whatever §2/§4 already say.

The palette lives in exactly one place, `src/app/globals.css`: Tailwind v4
`@theme` tokens plus a single `.plexus-bg` class that paints the navy base and
the layered radial teal glows with CSS gradients (no image asset, no new
library).

| Token | Hex | Used for |
|-------|-----|----------|
| `night` | `#0A2436` | card bodies, signed-in header bar |
| `night-deep` | `#071B29` | page base under the glows; dark text on mint bands |
| `lagoon` | `#0F3C4E` | mid-tone in the background glows |
| `mint` | `#52E0B5` | card header bands, links, field icons, accents |
| `brand` | `#2AA87F` | primary buttons; hover `brand-deep` `#1F8C69` |

The card (login and each role home):

- Centered, `max-w-sm` on `/login`, `max-w-md` on the homes; rounded 16 px
  (`rounded-2xl`); translucent navy body (night at ~90 %); hairline mint
  border (25 %); soft drop shadow.
- Header band: full-width mint, ~48 px tall, dark-teal text, ALL CAPS,
  wide letter-spacing (`tracking-[0.3em]`), reading "STAFF LOGIN" or
  "<ROLE> HOME".
- Field rows: mint icon + transparent input, white text, underline only
  (hairline white 30 %, mint on focus); ~1.25 rem between fields; 2 rem
  padding inside the card body.
- Primary button: solid `brand` teal, white ALL-CAPS letter-spaced label,
  `rounded-md`, full width.
- Error text: pale red (`#FCA5A5`) so it stays readable on navy.

Background and shell: `body` carries `plexus-bg` on every page; body text is
light (`slate-100`); the signed-in header is a `night` bar with mint accents.
`/admin/users` keeps its white table and form cards (with explicit dark text)
so the data stays readable on the dark shell.

Deliberately absent from the login card although the picture shows them —
requirements §5 excludes those features, and this restyle adds no behaviour:
"Remember me", "Forgot Password?", and any social-login buttons.

## 5. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The `User` model from section 1 |
| `prisma/seed.ts` | The six demo users of Reference B, hashed passwords |
| `.env` (git-ignored) | `DATABASE_URL`, `SESSION_SECRET` |
| `src/app/globals.css` | Tailwind import + the `@theme` look-and-feel tokens and the `.plexus-bg` background class (§4 "Look and feel") |
| `src/app/layout.tsx` | Root layout: dark plexus page shell; renders a small server-only header (name + Log out) only when `verifySession()` returns a user |
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

---

# Leave Request – Design

> **This file answers:** How is the leave module put together? (tables,
> statuses, rules, screens, who can do what, where the code lives)
> **Who:** The AI drafted it. You review all of it.
>
> Master: `01-requirements.md` leave section (stories U11–U21, checks
> AC-14–AC-28). If this file and the requirements disagree, fix the
> requirements first, then this file.

## 1. Tables

One new table. The `User` table (login section §1) is **untouched**: requests store
plain id numbers and the server checks them on every action (**my
call** — Prisma relations would force fields onto `User`, which belongs
to the login section of this spec).

### `LeaveRequest` – one row per request

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `employeeId` | number | yes | The requester (`User.id`); role `EMPLOYEE` checked on create |
| `supervisorId` | number | yes | The chosen supervisor (`User.id`); role `SUPERVISOR`, active, same division as the requester (rule 1) |
| `leaveType` | text | yes | One of Reference C |
| `otherLeaveType` | text | only when `OTHER` | "What the leave is for"; null otherwise |
| `startDate` | date | yes | First day of leave, stored at UTC midnight (rule 2) |
| `endDate` | date | yes | Last day; never before `startDate`; past dates allowed (interview) |
| `status` | text | yes | One of Reference D; server-set only, default `PENDING_SUPERVISOR` — the form never sends it |
| `supervisorRemark` | text | on supervisor reject | The supervisor's reason (1–500 chars) |
| `hrOfficerId` | number | on HR decide | The HR user who approved or rejected (`User.id`, AC-19) |
| `hrRemark` | text | on HR reject | The HR reason (1–500 chars) |
| `submittedAt` | date | auto | Set on create |
| `signedAt` | date | no | Set when the supervisor signs |
| `decidedAt` | date | no | Set on the HR decision |
| `withdrawnAt` | date | no | Set on withdraw |

Indexes for the queries in rule 8: `employeeId`, `supervisorId + status`,
`status`.

## 2. Fixed lists

### Reference C. Leave types (brief §7.2)

| Stored | Shown | Notes |
|--------|-------|-------|
| `ANNUAL` | Annual leave | Yearly paid leave |
| `MATERNITY` | Maternity leave | Expecting or just given birth |
| `UNPAID` | Unpaid leave | Leave without pay |
| `COMPASSIONATE` | Compassionate leave | Family emergency or bereavement; **no** explanation required (interview: the brief's field table makes "what it's for" required for `OTHER` only) |
| `OTHER` | Other | "What it's for" free text required, 1–200 chars trimmed |

SQLite has no enum: these are text values checked against an allowlist in
`src/app/lib/leave.ts`.

### Reference D. Statuses (brief §5.2 + one interview addition)

| Stored | Shown | Meaning | Final? |
|--------|-------|---------|--------|
| `PENDING_SUPERVISOR` | Pending supervisor | Submitted, waiting for the supervisor | no |
| `SIGNED` | Signed | The supervisor signed; the employee can send it to HR | no |
| `PENDING_HR` | Pending HR | In the shared HR queue | no |
| `APPROVED` | Approved | HR approved | final |
| `REJECTED_BY_SUPERVISOR` | Rejected by supervisor | Rejected with a reason | final |
| `REJECTED_BY_HR` | Rejected by HR | Rejected with a reason | final |
| `WITHDRAWN` | Withdrawn | Employee withdrew before the supervisor acted (U18 — added in interview, flag it if you disagree) | final |

### The only moves that exist

| From | To | Who, action |
|------|----|-------------|
| — (new) | `PENDING_SUPERVISOR` | employee `createLeave` |
| `PENDING_SUPERVISOR` | `SIGNED` | the named supervisor `supervisorDecide` (sign) |
| `PENDING_SUPERVISOR` | `REJECTED_BY_SUPERVISOR` | the named supervisor `supervisorDecide` (reject, remark required) |
| `PENDING_SUPERVISOR` | `WITHDRAWN` | the owner `withdrawLeave` |
| `SIGNED` | `PENDING_HR` | the owner `sendToHr` |
| `PENDING_HR` | `APPROVED` | any active HR `hrDecide` (approve) |
| `PENDING_HR` | `REJECTED_BY_HR` | any active HR `hrDecide` (reject, remark required) |

Any change not in this table does not exist and is refused (rule 3).

## 3. Business rules

1. **Create (U11, AC-14/15).** `createLeave` opens with
   `requireRole("EMPLOYEE")` — Supervisor, HR and Admin have no submit
   form at all (brief rule 5.3-2). Every field is validated on the
   server, never trusting the dropdowns: `leaveType` in Reference C;
   `otherLeaveType` required iff `OTHER`; real dates with
   `endDate >= startDate` (past dates allowed — interview);
   `supervisorId` is an **active** user with role `SUPERVISOR` **and**
   the requester's own `division`. The client sends only the four form
   fields; status, remarks and officer fields are server-set only.
2. **Dates (U19).** Date-only inputs are normalised to UTC midnight
   before writing, so the count is exact on every machine (**my call**).
   Duration = `(end − start) / 86 400 000 + 1` days, computed at render
   time, never stored (2026-11-25 → 2026-12-03 = 9 days, AC-22).
3. **One door per move (U21).** Every decision action re-reads the row
   from the database and refuses unless the current status is the legal
   "From" in the §2 table; then it writes only the target status plus its
   own fields (remark, officer, timestamp). The request's own content
   (type, dates, chosen supervisor) is never edited afterwards, and rows
   are never deleted.
4. **Supervisor decision (U12, AC-16/17).** Only the user whose id is
   the row's `supervisorId` — not a colleague supervisor in the same
   division. Sign needs no remark; reject requires 1–500 chars and
   stores it in `supervisorRemark`; signing sets `signedAt`.
5. **Send to HR (U13, AC-18).** Owner only, only from `SIGNED`;
   moves to `PENDING_HR`.
6. **HR decision (U14, AC-19/20).** Any active HR user — the queue is
   shared. The write is **conditional**: `updateMany` where `id` **and**
   `status = PENDING_HR`. If zero rows change, another officer decided
   first → "this request has already been decided", nothing else
   changes. On success set `hrOfficerId` to the logged-in user and
   `decidedAt = now`; reject requires 1–500 chars in `hrRemark`.
7. **Withdraw (U18, AC-26).** Owner only, only from `PENDING_SUPERVISOR`
   → `WITHDRAWN` + `withdrawnAt`. Once the supervisor has acted there is
   no way back (interview).
8. **Visibility (U15, AC-21–23).** Scoped in the database query, not by
   hiding: Employee → own rows only (all statuses); Supervisor →
   `supervisorId = me` (queue: `PENDING_SUPERVISOR`; history: what they
   signed or rejected, shown with their current status); HR → status in
   (`PENDING_HR`, `APPROVED`, `REJECTED_BY_HR`) — shared queue plus
   history naming the deciding officer; Admin → everything, read-only.
   A request still at the supervisor stage is invisible to HR.
9. **Final is final; re-apply is free (AC-28).** No action touches a
   final status; no duplicate or overlap check — a new submission is
   simply a new row.
10. **Confirm + success (U16, AC-24).** Same pattern as the Admin user
    actions: confirm before submitting, success message after. The
    strings live in `src/app/lib/messages.ts` (a `'use server'` file may
    only export async functions).
11. **Seed (U20, AC-27).** `prisma/seed.ts` also inserts demo requests
    covering all seven statuses, dated relative to today (e.g. +2 → +4
    days) and attached to the Reference B users — only when the
    `LeaveRequest` table is empty, so re-running never duplicates.
12. **No notifications.** Nothing is emailed; roles find out by opening
    their page (requirements §5).

## 4. Screens (routes)

| Route | Who | What it shows |
|-------|-----|---------------|
| `/employee` | Employee | "My leave requests": a **New request** button, then the employee's own requests newest first — type (+ "what it's for" for Other), dates with "**N days**", supervisor, status badge, remarks. Contextual buttons: **Withdraw** (only on *Pending supervisor*), **Send to HR** (only on *Signed*) |
| `/employee/leave/new` | Employee | The four fields of rule 1. Supervisor dropdown = active `SUPERVISOR` users in the employee's division; when the division has none: "No supervisor is available in your division — please contact the Admin" and submitting is off. The "what it's for" field appears — and is required — only when Other is chosen |
| `/supervisor` | Supervisor | "Waiting for your decision" — `PENDING_SUPERVISOR` rows where `supervisorId = me`, newest first, each with **Sign** and **Reject** (remark field required on reject); below, "Your decisions" — what the supervisor signed or rejected (newest first), with each row's current status |
| `/hr` | HR | "HR queue" — every `PENDING_HR` row, shared by all officers, newest first, with Approve/Reject (remark required on reject); below, "Decided" — `APPROVED` and `REJECTED_BY_HR` rows, newest first, with "Decided by {name}" |
| `/admin` | Admin | The existing home, plus a link to **All leave records** |
| `/admin/leave` | Admin | Every record, newest first: Employee · Division · Type · Dates (+ days) · Supervisor · Status · HR officer · remarks; one status filter dropdown; **no buttons that change anything** (FR-08) |

These replace the "…HOME" placeholders the login section §4 left for the
four role pages; `/admin` keeps its user link and gains the leave link.
The look-and-feel block in the login section §4 is unchanged — lists
reuse the night/mint card style, and the Admin leave table keeps a white
card like `/admin/users` so data stays readable.

## 5. Who can do what

Every row is checked on the server inside the action, not just in the UI:

| Action | Who | Precondition |
|--------|-----|--------------|
| Submit | `EMPLOYEE` | fields valid (rule 1) |
| Sign / reject | the named `SUPERVISOR` | status `PENDING_SUPERVISOR` |
| Send to HR | the owner (`EMPLOYEE`) | status `SIGNED` |
| Withdraw | the owner (`EMPLOYEE`) | status `PENDING_SUPERVISOR` |
| Approve / reject (HR) | any active `HR` user | status `PENDING_HR` |
| See every record | `ADMIN` | always, read-only |

## 6. Where the code lives (additions)

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | + the `LeaveRequest` model (the `User` model untouched) |
| `src/app/lib/leave.ts` | Reference C/D constants, the moves table, field validators, `durationDays()` — the single source the actions and pages import |
| `src/app/actions/leave.ts` | `'use server'`: `createLeave`, `supervisorDecide`, `sendToHr`, `hrDecide`, `withdrawLeave` — each opens with `requireRole` and re-checks owner + status (rules 3–7) |
| `src/app/lib/messages.ts` | + leave confirmation/success/error strings |
| `src/app/employee/page.tsx` | placeholder → "My leave requests" list |
| `src/app/employee/leave/new/page.tsx` | the request form |
| `src/app/supervisor/page.tsx`, `src/app/hr/page.tsx` | placeholders → queue + history |
| `src/app/admin/page.tsx` | + the "All leave records" link |
| `src/app/admin/leave/page.tsx` | read-only table + status filter |
| `src/components/` | `LeaveForm`, `LeaveRows` (+ status badge), `DecisionButtons`, `SendToHrButton`, `WithdrawButton`, `AdminLeaveTable` |
| `prisma/seed.ts` | + the demo requests of rule 11 |

## 7. Security (in plain words)

The login section §6 still applies; these are the leave-module additions,
mapped to OWASP Top 10:

- **Access control (A01).** `requireRole` runs in every page and every
  action; actions additionally check row **ownership** (withdraw, send
  to HR) or the **named supervisor / active-HR** condition; §4 lists are
  scoped inside the query itself, so "not shown" is never the protection.
  Admin has no mutation action at all.
- **State integrity (A01/A08).** The §2 moves table is the only path;
  the current status is re-read inside each action before writing; the
  HR decision is a conditional update, so the first officer wins (AC-20).
- **Injection (A03).** Prisma parameterised queries only.
- **Server-validated forms (A05).** Dropdown values, type allowlist,
  dates, and both remarks are re-checked server-side; tampered ids are
  refused (AC-15, AC-25).
- **XSS.** Remarks and "what it's for" render as plain text (React
  escapes); never as HTML.
- **Logging (A09).** Same rule as login: no passwords, no cookies.

## 8. Commands (added to the login section's §7 Commands)

| Command | What it does |
|---------|--------------|
| `npx prisma migrate dev --name leave_request` | Create/apply the `LeaveRequest` table |
| `npx prisma db seed` | Six users **+** the demo requests of rule 11 |
