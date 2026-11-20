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
| Done | 1 | Set up the database | High | (base for AC-01; design §1) |
| Done | 2 | Seed the six demo users | High | AC-01, AC-13 |
| Done | 3 | Login page and sessions | High | AC-01, AC-02, AC-08, AC-13 |
| Done | 4 | Header and Log out | High | AC-07 |
| Done | 5 | One generic failure message | High | AC-03 |
| Done | 6 | Lockout after 5 wrong passwords | High | AC-04 |
| Done | 7 | Guard every page (+ `?next`) | High | AC-05, AC-06 |
| Done | 8 | Demo box on the login page | Low | AC-09 |
| Done | 9 | Admin: user list + add user | Low | AC-10, AC-11 |
| Done | 10 | Admin: reset password, deactivate | Low | AC-12 |
| Done | 11 | Full check against the specs | High | AC-01 – AC-13 |

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

---

# Leave Request – Tasks

> **This file answers:** In what order do we build the leave module, and
> how do we check each step?
> **Who:** The AI drafted it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes
> its Status to Done. At the end, you check the whole app against the
> specs. If something is wrong, fix the spec first, then ask the AI to
> rebuild.
>
> Sources: requirements leave section (U11–U21, AC-14–AC-28), design
> leave section (rules §3, screens §4, who-can-do-what §5, files §6), the
> brief (§5–7), and the interview answers of 2026-11-20 (withdraw before
> the supervisor acts; past dates allowed; duration shown as calendar
> days; "what it's for" required for Other only; HR sees only the HR
> stage; Admin = one filtered table; seed demo requests).

**Priority.** High first, then Medium, then Low — same rule as the login
section. Task 12 (the full check) is High but always runs last.

| Status | # | Task | Priority | Checks (from requirements §4) |
|--------|---|------|----------|-------------------------------|
| To do | 1 | LeaveRequest table + migration | High | (base for AC-14; design §1) |
| To do | 2 | Status, type and validation helpers | High | (base for AC-15, AC-22; design rules 1–2) |
| To do | 3 | New request form + create action | High | AC-14, AC-15 |
| To do | 4 | My requests list (status, remark, duration) | High | AC-22 |
| To do | 5 | Supervisor queue + Sign/Reject | High | AC-16, AC-17, AC-25, AC-28 |
| To do | 6 | Employee: Send to HR | High | AC-18 |
| To do | 7 | HR queue + decide, officer recorded, first decision wins | High | AC-19, AC-20, AC-21 |
| To do | 8 | Confirmation + success on every action | High | AC-24 |
| To do | 9 | Admin: all-records table + status filter | Medium | AC-23 |
| To do | 10 | Withdraw while Pending supervisor | Low | AC-26 |
| To do | 11 | Seed: demo requests in every status | Low | AC-27 |
| To do | 12 | Full check against the specs | High | AC-14 – AC-28 |

---

## Task 1 – LeaveRequest table + migration *(High)*

> From: design leave §1 (fields, indexes), brief §7.2 (leave request
> fields).

- **Goal:** The SQLite database has the `LeaveRequest` table exactly as
  designed, alongside the untouched `User` table; `npm run dev` still
  works.
- **Files:** `prisma/schema.prisma` (add the model — the `User` model
  stays as is).
- **Check (by hand):** run `npx prisma migrate dev --name leave_request`
  — it must print a new migration. Run `npx prisma studio` and confirm
  all 15 fields from design §1 (`id, employeeId, supervisorId, leaveType,
  otherLeaveType, startDate, endDate, status, supervisorRemark,
  hrOfficerId, hrRemark, submittedAt, signedAt, decidedAt, withdrawnAt`),
  with `status` defaulting to `PENDING_SUPERVISOR` and the three indexes
  from design §1 present.

## Task 2 – Status, type and validation helpers *(High)*

> From: design rules 1–2 (server-side checks, duration), References C/D
> and the moves table.

- **Goal:** One module owns every leave constant and rule the server
  will enforce, so pages and actions never invent their own values.
- **Files:** `src/app/lib/leave.ts` (Reference C/D constants, the moves
  table, `validateLeaveFields()`, `durationDays()`), reusing the style of
  `src/app/lib/validation.ts`.
- **Check (by hand):** `npm run lint` passes. Then run a throwaway
  script with `node` (this machine has Node 26, which runs `.ts`
  directly): assert `durationDays(2026-11-25, 2026-12-03) === 9`;
  `validateLeaveFields` refuses end-before-start, `OTHER` without
  "what it's for", and an unknown `leaveType`, and accepts Compassionate
  with no text; the moves table allows only the seven §2 transitions.
  Delete the script after the check.

## Task 3 – New request form + create action *(High)*

> From: U11; AC-14, AC-15; design rule 1, §4 (`/employee/leave/new`).

- **Goal:** An employee can submit a request; every dropdown and field
  is re-checked on the server; the row lands as *Pending supervisor*.
- **Files:** `src/app/employee/leave/new/page.tsx`,
  `src/components/LeaveForm.tsx`, `src/app/actions/leave.ts`
  (`createLeave` — opens with `requireRole("EMPLOYEE")`),
  `src/app/lib/messages.ts`, "New request" button on
  `src/app/employee/page.tsx` (still a placeholder page until task 4 —
  a plain link is fine for now).
- **Check (by hand):** as `employee-1@budiman.com` open
  `/employee/leave/new`: the supervisor dropdown shows exactly
  Supervisor 1 and Supervisor 2; pick Annual, 2026-11-25 → 2026-12-03,
  confirm → success message (AC-14). End before start → clear refusal;
  Other with empty "what it's for" → clear refusal; Compassionate with
  nothing → accepted (AC-15). DevTools: change the supervisor option's
  value to hr-1's id → the server refuses; `npx prisma studio` shows no
  new row. Yesterday → today is accepted (AC-14, past dates).

## Task 4 – My requests list *(High)*

> From: U15, U19; AC-22 (employee part); design §4 (`/employee`), rule 2.

- **Goal:** The employee home replaces its placeholder with the
  employee's own requests, newest first, with type, dates, "N days",
  supervisor and status badge.
- **Files:** `src/app/employee/page.tsx`, `src/components/LeaveRows.tsx`
  (shared row + status badge; remark column included but still empty at
  this stage — remarks are verified in task 5).
- **Check (by hand):** as `employee-1@`, the 2026-11-25 → 2026-12-03
  request shows **9 days**; rows are newest first; each shows its status
  badge; only the employee's own rows appear — no data from
  `supervisor-1@`'s submissions can be coaxed out (queries are scoped,
  design rule 8).

## Task 5 – Supervisor queue + Sign/Reject *(High)*

> From: U12; AC-16, AC-17, AC-25, AC-28; design rule 3–4, §4
> (`/supervisor`).

- **Goal:** The named supervisor sees only their pending requests and
  can sign or reject (remark required); others are refused server-side;
  a rejected request can be re-submitted freely.
- **Files:** `src/app/supervisor/page.tsx` (queue + "Your decisions"),
  `src/components/DecisionButtons.tsx`, `src/app/actions/leave.ts`
  (`supervisorDecide` — `requireRole("SUPERVISOR")` + named-supervisor +
  status re-check).
- **Check (by hand):** as `employee-1@`, submit one request naming
  Supervisor 1 and one naming Supervisor 2. As `supervisor-1@`: only
  theirs is in "Waiting for your decision"; **Sign** → success, status
  *Signed*; it moves to "Your decisions" (AC-16). As `supervisor-2@`:
  **Reject** with no remark → refused; with remark → *Rejected by
  supervisor*, and the remark is visible on the employee's list (AC-17).
  Tamper with the decision form's hidden id to aim at supervisor-1's
  request → server refuses, status unchanged (AC-25). As the employee,
  submit a new request with the same type/dates/supervisor as the
  rejected one → accepted; the rejected row is untouched (AC-28).

## Task 6 – Employee: Send to HR *(High)*

> From: U13; AC-18; design rule 5.

- **Goal:** A *Signed* request of mine shows **Send to HR**; one click
  moves it to the shared HR queue; nothing else has that button.
- **Files:** `src/app/employee/page.tsx` (contextual button),
  `src/app/actions/leave.ts` (`sendToHr` — owner + `SIGNED` re-check).
- **Check (by hand):** as `employee-1@`, the *Signed* row gets **Send to
  HR**; click → confirmation → success; status *Pending HR*; button gone.
  No other row (new, approved, rejected, withdrawn) shows the button.
  Tamper with the id in DevTools to point at someone else's row →
  refused.

## Task 7 – HR queue: decide, officer, first-decision-wins *(High)*

> From: U14; AC-19, AC-20, AC-21; design rule 6; §4 (`/hr`).

- **Goal:** Every active HR officer sees the shared *Pending HR* queue;
  approving or rejecting records the officer; a rejection needs a
  remark; two officers clicking at once → first wins; supervisor-stage
  requests stay invisible to HR.
- **Files:** `src/app/hr/page.tsx` (queue + "Decided" history),
  `src/components/DecisionButtons.tsx` (reuse), `src/app/actions/leave.ts`
  (`hrDecide` — `requireRole("HR")` + conditional `updateMany`).
- **Check (by hand):** get one request to *Pending HR*; as `hr-1@` the
  queue lists it; `hr-2@` in a private window sees the same row
  (AC-19). Before deciding, submit a fresh employee request and check
  it is **nowhere** on `/hr` (AC-21). hr-1 approves → *Approved*,
  "Decided by HR 1"; it moves to "Decided" for hr-2 too. Second
  *Pending HR* request: hr-2 rejects with no remark → refused; with
  remark → *Rejected by HR*, "Decided by HR 2"; the employee sees the
  remark. Race: open a third *Pending HR* request as hr-1 and hr-2 in
  two windows — hr-2 approves first, hr-1 then gets "this request has
  already been decided" and the status stays *Approved* (AC-20).

## Task 8 – Confirmation + success on every action *(High)*

> From: U16; AC-24; brief rule 5.3-7; design rule 10.

- **Goal:** Submit, Sign, Reject, Send to HR, HR approve and HR reject
  each ask for confirmation first (cancel = nothing happens) and show a
  clear success message after — using the Admin-user-actions pattern and
  strings from `messages.ts`.
- **Files:** the components from tasks 3–7 — no new pages expected.
- **Check (by hand):** repeat each action once: click, cancel the
  confirmation → status unchanged in the DB (studio) and on screen;
  repeat and confirm → success message and new status visible after the
  page refresh. (Withdraw joins this check in task 12.)

## Task 9 – Admin: all-records table + status filter *(Medium)*

> From: U17; AC-23; design §4 (`/admin/leave`), rule 8.

- **Goal:** Admin sees every record, newest first, with remarks,
  officer and days — read-only, one status filter, no action buttons.
- **Files:** `src/app/admin/leave/page.tsx`, `src/components/AdminLeaveTable.tsx`,
  link from `src/app/admin/page.tsx`.
- **Check (by hand):** as `admin@budiman.com` open `/admin/leave`: all
  rows from every test above, newest first, remarks and "Decided by"
  shown; filter to *Approved* → only approvals (AC-23). The page has no
  buttons that change data. As `employee-1@`, type `/admin/leave` in
  the address bar → bounced to `/employee` (extends AC-06).

## Task 10 – Withdraw while Pending supervisor *(Low)*

> From: U18; AC-26; design rule 7. *Interview addition — beyond the
> brief, so Low.*

- **Goal:** The owner can withdraw one of their own
  *Pending supervisor* requests; no other status and no other user can.
- **Files:** `src/app/employee/page.tsx` (Withdraw button),
  `src/app/actions/leave.ts` (`withdrawLeave` — owner +
  `PENDING_SUPERVISOR` re-check).
- **Check (by hand):** as `employee-1@`, submit a fresh request, click
  **Withdraw** → confirmation → success → status *Withdrawn*, no
  buttons left. A *Signed* row has no Withdraw button; a tampered
  request is refused by the server. Confirm + success behave as in
  task 8 (AC-24 gains Withdraw).

## Task 11 – Seed: demo requests in every status *(Low)*

> From: U20; AC-27; design rule 11. *Interview addition, so Low.*

- **Goal:** A fresh database gets a handful of demo requests covering
  all seven statuses, attached to the Reference B users, dated relative
  to today — and re-running the seed never duplicates them.
- **Files:** `prisma/seed.ts` (insert only when `LeaveRequest` is empty).
- **Check (by hand):** delete the SQLite file, `npx prisma migrate dev`
  + `npx prisma db seed`. `employee-1@` sees a mixed personal history
  (including a rejected-with-remark row); `supervisor-1@`'s queue has a
  pending item and "Your decisions" has past ones; `hr-1@`'s queue has
  *Pending HR* items and "Decided" has both outcomes with officer names;
  `admin@`'s `/admin/leave` shows all seven statuses (AC-27). Run the
  seed again → same row count, no duplicates.

## Task 12 – Full check against the specs *(High)*

> From: the brief's Plan §8 (step 6 Check); every leave AC row.

- **Goal:** The whole leave module is walked through once, fresh,
  against the acceptance table; the app is committed with a Conventional
  Commit message (e.g. `feat: leave request module`).
- **Files:** none new — statuses in `01-requirements.md` §4 and this
  file flipped from "To do" to "Done".
- **Check (by hand):** delete `prisma/*.db`, re-run migrate + seed,
  `npm run lint` passes. Work through AC-14 → AC-28 top to bottom with
  the demo accounts (the two-window race from AC-20 needs a private
  window). Also re-run the login checks AC-01 → AC-06 to prove the new
  pages didn't break the door. Anything that fails: fix the spec first,
  then the code (project rule).
