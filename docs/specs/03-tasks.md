# Login – Tasks

> **This file answers:** In what order do we build it, and how do we check each step?
> **Who:** The AI drafts it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes its
> Status to Done. At the end, you check the whole app against the specs.
> If something is wrong, fix the spec first, then ask the AI to rebuild.
>
> Sources: `01-requirements.md` (U/AC), `02-design.md` (rules §2, files §5,
> screens §4, Reference A/B), the brief (`docs/Agentic AI - HRMS Doc.pdf`),
> and the interview answers (8-hour session, 5 strikes/30 min auto-unlock,
> Admin user page, demo box).

**Priority.** Every task is **High**, **Medium** or **Low**. Do High first.
Do Low only if time is left, and only if you ask.

| Status | # | Task | Priority | Checks (from requirements §4) |
|--------|---|------|----------|-------------------------------|
| To do | 1 | Set up the database | High | (base for AC-01; design §1) |
| To do | 2 | Seed the six demo users | High | AC-01, AC-13 |
| To do | 3 | Login page and sessions | High | AC-01, AC-02, AC-08, AC-13 |
| To do | 4 | Header and Log out | High | AC-07 |
| To do | 5 | One generic failure message | High | AC-03 |
| To do | 6 | Lockout after 5 wrong passwords | High | AC-04 |
| To do | 7 | Guard every page (+ `?next`) | High | AC-05, AC-06 |
| To do | 8 | Demo box on the login page | Low | AC-09 |
| To do | 9 | Admin: user list + add user | Low | AC-10, AC-11 |
| To do | 10 | Admin: reset password, deactivate | Low | AC-12 |
| To do | 11 | Full check against the specs | High | AC-01 – AC-13 |

---

## Task 1 – Set up the database *(High)*

> From: design §1 (User table), brief §7.2 (fields), §7.3 (SQLite + Prisma).

- **Goal:** The project has a real SQLite database with the `User` table
  exactly as designed; `npm run dev` still works.
- **Files:** `prisma/schema.prisma` (new), `.env` (new: `DATABASE_URL`,
  placeholder `SESSION_SECRET`), `.gitignore` (add `.env`, `prisma/*.db`),
  `package.json` (Prisma only if missing from the pinned versions — ask first).
- **Check (by hand):** run `npx prisma migrate dev --name login` — it must
  create the SQLite file and print a migration. Run `npx prisma studio` and
  confirm the `User` table shows all 11 fields from design §1
  (`name, icNo, email, passwordHash, role, division, designation, active,
  failedAttempts, lockedUntil, createdAt`), `email` and `icNo` marked unique.

## Task 2 – Seed the six demo users *(High)*

> From: U8, AC-01, AC-13; design rule 8 + Reference B; brief §7.2 (demo data).

- **Goal:** A fresh database gets the six demo users with `password123`
  stored only as bcrypt hashes, and re-seeding never duplicates them.
- **Files:** `prisma/seed.ts` (new), `package.json` (prisma seed config —
  script only, no new dependencies).
- **Check (by hand):** run `npx prisma db seed`, then `npx prisma studio`.
  You should see six rows matching Reference B (emails, IC numbers, roles).
  Every `passwordHash` starts with `$2b$` — never the text `password123`.
  Run the seed again: still six rows, no duplicates.

## Task 3 – Login page and sessions *(High)*

> From: U1, U2, U6; AC-01, AC-02, AC-08; design rules 3, 5, 6; brief §7.1
> (signed session cookie) and §7.2 (email logs in). Interview: 8-hour session.

- **Goal:** `/login` accepts email + password, and a correct login sets the
  signed 8-hour cookie and lands the user on their role's home page.
- **Files:** `src/app/lib/session.ts`, `src/app/lib/dal.ts`,
  `src/app/actions/auth.ts` (login), `src/app/login/page.tsx`,
  `src/components/LoginForm.tsx`, role home placeholders
  `src/app/employee/page.tsx`, `supervisor/`, `hr/`, `admin/page.tsx`,
  replace `src/app/page.tsx` (redirect to `/login` for now).
- **Check (by hand):** start `npm run dev`; open `http://localhost:3000` —
  you should end up at `/login`. Sign in as `employee-1@budiman.com` /
  `password123` → the Employee home appears (AC-01). Sign out (clear the
  cookie in dev tools for now) and repeat as `supervisor-1@`, `hr-1@`,
  `admin@` — each lands on its own page (AC-02). In dev tools → Application →
  Cookies: one `session` cookie, `HttpOnly` ticked, expiry about 8 hours out
  (AC-08, AC-13). To test expiry sooner: advance the Windows clock by 9 hours,
  click any page → back at `/login`; restore the clock (AC-08).

## Task 4 – Header and Log out *(High)*

> From: U5; AC-07; design §4 (logout action), rule 3 (destroySession).

- **Goal:** Every signed-in page shows the user's name and a Log out button
  in the header; logging out really ends the session.
- **Files:** `src/app/layout.tsx` (server header when signed in),
  `src/components/Header.tsx`, `src/app/actions/auth.ts` (logout).
- **Check (by hand):** log in as `employee-1@budiman.com` — header shows
  "Employee 1" and Log out (AC-01). Click Log out → `/login`. Press browser
  Back → still `/login`, no employee page. Type `localhost:3000/employee` →
  redirected to `/login` (AC-07).

## Task 5 – One generic failure message *(High)*

> From: U7; AC-03; design rule 1; brief §7.5/FR-09 (OWASP).

- **Goal:** A wrong email or wrong password always shows exactly "Email or
  password is incorrect" — the login action never compares timing or reveals
  which part failed, nor that an account exists or is deactivated.
- **Files:** `src/app/actions/auth.ts` (failure paths, dummy-hash compare).
- **Check (by hand):** try `employee-1@budiman.com` / `wrongpass` — one
  generic line. Try `nobody@budiman.com` / `password123` — the *same* line,
  same page structure. Nothing on screen says "unknown email", "deactivated"
  or anything similar (AC-03).

## Task 6 – Lockout after 5 wrong passwords *(High)*

> From: U7; AC-04; design rule 2. Interview: 5 strikes, 30 min, auto-unlock
> only, no Admin unlock.

- **Goal:** The fifth consecutive wrong password locks the account for 30
  minutes; the correct password is refused while locked; after the lock passes
  (or `lockedUntil` is set to the past in the DB) the correct password works
  and the counter resets.
- **Files:** `src/app/actions/auth.ts` (failedAttempts / lockedUntil logic).
- **Check (by hand):** as `employee-1@budiman.com`, enter a wrong password 5
  times, then `password123` — still refused, still the generic message. In
  `npx prisma studio`, set that user's `lockedUntil` to 1 hour ago (and back,
  to repeat) → `password123` now logs in. Fail twice then log in correctly,
  and `failedAttempts` reads 0 (AC-04).

## Task 7 – Guard every page (+ `?next`) *(High)*

> From: U3, U4; AC-05, AC-06; design rules 4, 5; brief rule 5.3-1
> (role decides which pages they can open).

- **Goal:** No protected page renders without a valid session; a valid
  session with the wrong role is sent to its own home; login honours a safe
  `?next` and ignores foreign ones. `verifySession()`/`requireRole()` are the
  single door used by all pages.
- **Files:** `src/app/lib/dal.ts` (requireRole, redirect helpers), the four
  role pages + `/` (call the guard as their first act).
- **Check (by hand):** logged out, open `/hr` directly → `/login?next=/hr`;
  sign in as `hr-1@budiman.com` → land on `/hr` (AC-05). Log in as
  `employee-1@budiman.com`, then type `/supervisor`, `/hr`, `/admin` — each
  bounces to `/employee`, with no other-role content flashing (AC-06). Try
  `/login?next=https://evil.example` → after login you are on your own home,
  not on the external site (design rule 5).

## Task 8 – Demo box on the login page *(Low)*

> From: U9; AC-09. Interview: show demo logins.

- **Goal:** `/login` shows a clearly labelled "Demo data" box with the six
  emails and `password123`, so workshop people can try each role.
- **Files:** `src/components/DemoAccountsBox.tsx`, `src/app/login/page.tsx`.
- **Check (by hand):** open `/login` signed out — the box lists all six
  emails from Reference B and `password123`, labelled "Demo data". Clicking
  an email (if made clickable) fills the email field. Nothing from the box
  appears on other pages.

## Task 9 – Admin: user list + add user *(Low)*

> From: U10; AC-10, AC-11; design rule 7; brief §7.2 (fixed lists, field
> formats). Interview: Admin manages users; deactivate not delete.

- **Goal:** `/admin/users` lists all users; Admin can add a user with all
  brief fields; the server rejects bad email (not `@budiman.com`, duplicate),
  bad IC format, and designations from the wrong division. Each action asks
  for confirmation, then shows a success message (brief rule 5.3-7).
- **Files:** `src/app/admin/users/page.tsx`, `src/app/actions/users.ts`
  (add; each starts with `requireRole('ADMIN')`), `src/components/UsersTable.tsx`,
  `src/components/AddUserForm.tsx`, `src/app/lib/validation.ts`.
- **Check (by hand):** as `admin@budiman.com` open `/admin/users` → all users
  with name, email, role, division, active. Add "Tester 1",
  `tester-1@budiman.com`, IC `00-111111`, Employee/Finance/Accounts Clerk,
  password `password123` → success message, row appears; sign out and log in
  as Tester 1 → Employee home (AC-10). Try `tester-2@gmail.com` and a
  duplicate `employee-1@budiman.com` → clear refusals, no rows created
  (AC-11). As `employee-1@budiman.com`, type `/admin/users` → bounced
  (extends AC-06).

## Task 10 – Admin: reset password, deactivate *(Low)*

> From: U10; AC-12; design rule 7.
> Interview: deactivate instead of delete; no Admin unlock for lockouts.

- **Goal:** On `/admin/users`, Admin can reset any password (fresh hash,
  clears lock fields) and deactivate/reactivate; a deactivated user gets the
  generic login failure; Admin cannot reset or deactivate their own account.
- **Files:** `src/app/actions/users.ts` (resetPassword, setActive),
  `src/components/UsersTable.tsx` (buttons + confirmations).
- **Check (by hand):** deactivate `tester-1@budiman.com`; try logging in as
  them with the right password → "Email or password is incorrect" (AC-12).
  Reactivate; reset their password to `newpass456` → `password123` fails,
  `newpass456` logs in. Check in studio that the stored hash changed and is
  still `$2b$…`. Try to deactivate/reactivate `admin@budiman.com` from the
  table → refused (design rule 7).

## Task 11 – Full check against the specs *(High)*

> From: the brief's Plan §8 (step 6 Check); every AC row.

- **Goal:** The whole login module is walked through once, fresh, against the
  acceptance table; the app is committed with a Conventional Commit message
  (e.g. `feat: login module`).
- **Files:** none new — statuses in `01-requirements.md` §4 flipped from
  "To do" to "Done".
- **Check (by hand):** delete `prisma/*.db`, re-run migrate + seed,
  `npm run lint` passes. Work through AC-01 → AC-13 top to bottom with the
  demo accounts (use the clock/DB tricks from AC-04 and AC-08). Anything
  that fails: fix the spec first, then the code (project rule).
