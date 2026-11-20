# Login – Requirements

> **This file answers:** What should the app do, and why?
> **Who:** The AI drafts it from your interview. You review it.
>
> When the app's behaviour needs to change, update this file **first**.

## 1. The problem

The Leave Request module is only safe if the system knows who is looking:
an employee must not see the HR queue, and nobody outside Budiman must get
in at all. Today there is no system at all — this module is the front door
every other feature stands behind.

Fixed by the brief (`docs/Agentic AI - HRMS Doc.pdf`): login by work email
(unique, ends `@budiman.com`) and password; passwords stored hashed with
bcryptjs, never plain text; session kept in a signed cookie; one role per
user; every page and every action re-checks the role on the server
(FR-01, FR-09 / OWASP Top 10).

This module provides:

1. A login page for the four roles, and a logout button
2. One home page per role, unreachable by other roles
3. Session expiry after 8 hours, and lockout after repeated wrong passwords
4. The six demo accounts from the brief, seeded so anyone can test
5. An Admin page to add users, reset passwords, and deactivate/reactivate
   accounts (agreed in interview; an addition beyond the brief, so Low)

## 2. Who uses it (roles)

| Role | Home page | What they do |
|------|-----------|--------------|
| **Employee** | `/employee` | Logs in, sees the employee home, logs out |
| **Supervisor** | `/supervisor` | Logs in, sees the supervisor home, logs out |
| **HR** | `/hr` | Logs in, sees the HR home, logs out |
| **Admin** | `/admin` | Logs in, sees the admin home, manages user accounts |

Routes are my call, agreed here so the tests have names to use. Home pages
show a role-appropriate placeholder until the leave-request specs land.

## 3. User stories

- **U1. Log in** *(High)*. As a Budiman user, I can log in with my
  `@budiman.com` email and my password so that only staff can use the system.
- **U2. My role's home page** *(High)*. As a user, I land on my own role's
  home page after login so that I only ever see what my role needs.
- **U3. Other roles' pages are closed** *(High)*. As a user, I cannot open
  another role's pages — even by typing the URL — so that request data stays
  private to each role.
- **U4. No login, no pages** *(High)*. As a visitor who is not logged in, I
  am redirected to the login page, and after logging in I arrive at the page
  I first asked for, so that protected pages are never shown unauthenticated.
- **U5. Log out** *(High)*. As a user, I can log out from a button in the
  header so that the next person on a shared laptop cannot open my account.
- **U6. Session expires after 8 hours** *(High)*. As the company, we have
  logins expire 8 hours after they start (one workday) so that a left-open
  laptop does not stay signed in forever.
- **U7. Wrong passwords stop at five** *(High)*. As the company, an account
  locks for 30 minutes after 5 wrong passwords in a row, and the login page
  never says whether the email or the password was wrong, so that guessing
  passwords is slow and reveals nothing (FR-09, OWASP Top 10).
- **U8. Demo accounts are ready** *(High)*. As a tester, the six demo users
  from the brief exist in a fresh database with password `password123`, so
  that every test below can be repeated by anyone.
- **U9. Demo hints on the login page** *(Low)*. As a workshop participant, I
  see the six demo emails and the shared password in a clearly labelled
  "Demo data" box on the login page so that I can try each role without
  hunting through the document.
- **U10. Admin manages users** *(Low)*. As an Admin, I can add a user
  (name, IC no., email, role, division, designation, initial password),
  reset someone's password, and deactivate/reactivate accounts — deactivating
  instead of deleting so old leave records keep their history.
  *Agreed in interview; beyond the brief, so Low per project rules.*

## 4. Acceptance checklist

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| Done | AC-01 | Correct email + password opens that role's home page (U1, U2) | • Open `/` with no session<br>• Enter `employee-1@budiman.com` / `password123`<br>• You should see the Employee home (`/employee`) with the user's name and a Log out button |
| Done | AC-02 | Each of the six demo accounts reaches its own home page (U2, U8) | • Log out, then log in as `supervisor-1@budiman.com`, `hr-1@budiman.com`, `admin@budiman.com` (all `password123`)<br>• You should land on `/supervisor`, `/hr`, `/admin` respectively |
| Done | AC-03 | Wrong email and wrong password give the same message (U7) | • Log in with `employee-1@budiman.com` / `wrongpass`<br>• Note the message. Now try `nobody@budiman.com` / `password123`<br>• Both should show exactly "Email or password is incorrect" — nothing about which part failed, and the page must not say the account exists or not |
| Done | AC-04 | 5 wrong passwords lock the account for 30 minutes, then it opens by itself (U7) | • Enter `employee-1@budiman.com` with a wrong password 5 times<br>• Try the correct `password123`<br>• You should still be refused<br>• In the SQLite database (e.g. `sqlite3` CLI), set that user's lock time to a moment in the past<br>• Try again — login should now succeed |
| Done | AC-05 | Protected pages redirect to login, then return you (U4) | • Without logging in, open `/hr` directly<br>• You should land on the login page (not `/hr`)<br>• Log in as `hr-1@budiman.com`<br>• You should arrive at `/hr`, not the default home |
| Done | AC-06 | Other roles' pages refuse entry even by URL (U3) | • Log in as `employee-1@budiman.com`<br>• Type `/supervisor`, `/hr` and `/admin` in the address bar, one by one<br>• Each should be refused (redirect to your own home or a "not allowed" page) — no HR/supervisor/admin content should ever render |
| Done | AC-07 | Log out truly ends the session (U5) | • Log in, click Log out<br>• Press the browser Back button<br>• Open `/employee` by URL<br>• You should be at the login page both times, never seeing the employee home |
| Done | AC-08 | Sessions die 8 hours after login (U6) | • Log in as `employee-1@budiman.com`<br>• In the database, change the session's expiry to 9 hours ago (or move the system clock forward 8 hours)<br>• Click any page link<br>• You should be back at the login page; after logging in again you should land on `/employee` |
| Done | AC-09 | Login page shows the demo box (U9) | • Open `/login`<br>• You should see a small box labelled "Demo data" listing the six demo emails and `password123` |
| Done | AC-10 | Admin can add a user, and the new user can log in (U10) | • Log in as `admin@budiman.com`, open the user-management page<br>• Add a user: name "Tester 1", IC `00-111111`, email `tester-1@budiman.com`, role Employee, division Finance, designation Accounts Clerk, initial password `password123`<br>• Log out; log in as `tester-1@budiman.com`<br>• You should reach the Employee home |
| Done | AC-11 | Admin validation rejects bad data (U10) | • On the add-user form, submit with email `tester-2@gmail.com` and with a duplicate `employee-1@budiman.com`<br>• Each should be refused with a clear message ("must end @budiman.com", "email already used"); no user should be created |
| Done | AC-12 | Admin can deactivate and reactivate; reset a password (U10) | • As Admin, deactivate `tester-1@budiman.com`; try to log in as them<br>• You should get the same "Email or password is incorrect" message (deactivation must not announce itself)<br>• Reactivate the user and reset their password to `newpass456`<br>• Old password fails; `newpass456` logs in |
| Done | AC-13 | Passwords are stored hashed (U1, FR-09) | • Open the SQLite database and look at the Users table<br>• Every password value should be a bcrypt hash (`$2b$…`), never `password123` in the clear; the browser dev tools' cookies panel should show one session cookie, flagged HttpOnly |

## 5. Not included (for now)

- Users changing their own password (Admin reset only)
- Password reset by email — the system sends no email
- An Admin "unlock now" button — lockout clears itself after 30 minutes
  (decided in interview)
- "Remember me", longer sessions, or multiple devices per user
- Multi-factor authentication
- Self sign-up of accounts — Admin adds users, or the seed script does
- Managing divisions and designations — they are the fixed lists from the brief
- Anything about leave requests themselves — that is the next spec

---

# Leave Request – Requirements

> **This file answers:** What should the leave module do, and how do I test
> it?
> **Who:** The AI drafted it from the brief (`docs/Agentic AI - HRMS
> Doc.pdf` §4–6) and the interview of 2026-11-20. You review it.
>
> Numbering continues from the login section above (stories U11–U21,
> checks AC-14–AC-28) so every ID stays unique across this file.
> When the behaviour needs to change, update this file **first**.

## 1. The problem

Budiman still approves leave on paper: forms get lost, an employee
cannot see where a request is, and HR has no single list waiting for a
decision (brief §2). This module replaces that flow inside the login the
login module already guards: the employee submits, the supervisor signs
or rejects, the employee sends a signed request to a shared HR queue,
HR decides, and the Admin watches over everything.

Fixed by the brief: the workflow and its statuses (§5.2), the supervisor
chosen from the requester's own division (§5.3-3), a remark required on
every rejection (FR-03, FR-05), the deciding HR officer recorded
(FR-05), Admin view only (FR-08), confirmation + success message on
every action (FR-07), and OWASP on everything (FR-09).

Decided in the interview 2026-11-20 (my proposals, you accepted):
withdraw before the supervisor acts, past dates allowed, duration shown
as calendar days, the "what it's for" text required for **Other** only,
HR sees only requests that reached the HR stage, Admin is one filtered
table, and the seed creates demo requests.

This module provides:

1. A request form for employees (five leave types, supervisor from
   their own division)
2. A supervisor queue: sign or reject with a remark
3. Send-to-HR, then a shared HR queue: approve or reject, officer
   recorded, first decision wins
4. A list per role showing status, remarks and duration
5. An Admin view of every record, view only
6. Withdraw while still *Pending supervisor* (beyond the brief → Low)
7. Demo requests in the seed so every screen has data

## 2. Who uses it (roles)

| Role | Leave pages | What they do here |
|------|-------------|-------------------|
| **Employee** | `/employee`, `/employee/leave/new` | Submits, tracks, withdraws (while *Pending supervisor*), sends a signed request to HR |
| **Supervisor** | `/supervisor` | Signs or rejects the requests sent to them; a rejection needs a remark |
| **HR** | `/hr` | Approves or rejects the shared queue; a rejection needs a remark; the system records who decided |
| **Admin** | `/admin/leave` | Sees every record, changes nothing |

Only the **Employee** role submits leave — Supervisors, HR and Admin
have no submit form (brief rule 5.3-2; my call, flagged, not overridden).

## 3. User stories

- **U11. Submit a leave request** *(High)*. As an employee, I submit a
  leave type, start and end date, and a supervisor — the dropdown offers
  only supervisors from my own division — and after a confirmation my
  request appears as *Pending supervisor*. The only date rule is
  end ≥ start, past dates allowed; the "what it's for" text is required
  when the type is Other. (FR-02)
- **U12. The supervisor decides** *(High)*. As a supervisor, I see only
  the requests sent to me; I sign them or reject them, and a rejection
  must carry a remark. The result is final. (FR-03)
- **U13. Send a signed request to HR** *(High)*. As an employee, a
  signed request of mine shows a **Send to HR** button; one click moves
  it into the shared HR queue. (FR-04)
- **U14. HR decides** *(High)*. As an HR officer, I see every
  *Pending HR* request; I approve or reject (a rejection needs a
  remark), the system records which officer decided, and if another
  officer got there first my click changes nothing. (FR-05)
- **U15. I see what I must act on** *(High)*. Every role gets its own
  current and past lists with status and remarks; HR sees only requests
  that reached the HR stage; Admin sees everything. (FR-06)
- **U16. Confirm, then know it worked** *(High)*. Every leave action
  asks for confirmation first and shows a success message after. (FR-07)
- **U17. Admin oversight** *(Medium)*. As Admin, I see every leave
  record in one newest-first table with a status filter, view only.
  (FR-08)
- **U18. Withdraw before the supervisor acts** *(Low)*. As an employee,
  I can withdraw one of my requests while it is still *Pending
  supervisor*; never after. *Agreed in interview; beyond the brief, so
  Low per project rules.*
- **U19. Duration at a glance** *(Medium)*. Lists show the number of
  days next to each request (calendar days, both ends included),
  computed from the dates — nothing stored, no work-day calendar.
  *Agreed in interview; unlike U18 this is not a separate feature but
  part of the FR-06 lists themselves, so Medium rather than the usual
  Low for beyond-brief extras.*
- **U20. Demo requests are ready** *(Low)*. A fresh database gets
  requests covering every status, so each role's screen has data to
  show without clicking through the flow first. *Agreed in interview.*
- **U21. Secure by design (leave)** *(High)*. Every leave page and
  every leave action re-checks the role, the owner and the current
  status on the server; a wrong step shows an error and changes nothing
  (FR-09, OWASP Top 10).

## 4. Acceptance checklist

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| To do | AC-14 | Employee submits; supervisor dropdown = own division only; past dates accepted (U11) | • Log in as `employee-1@budiman.com` → `/employee` → New request<br>• Pick Annual leave, 2026-11-25 → 2026-12-03<br>• Open the supervisor dropdown: exactly **Supervisor 1** and **Supervisor 2** (the two Finance supervisors) — no HR, no Admin, no employees<br>• Confirm → success message; the row appears in My requests as *Pending supervisor*<br>• Submit again with start = yesterday, end = today → accepted (interview: past dates allowed) |
| To do | AC-15 | Bad data is refused by the server, even from a tampered form (U11) | • End before start → clear error, nothing stored<br>• Type **Other** with empty "what it's for" → clear error; type **Compassionate** with no text → accepted (interview: Other only)<br>• In DevTools, change the supervisor option's value to hr-1's id and submit → the server refuses with a clear error and stores nothing |
| To do | AC-16 | The supervisor sees only their own; sign works (U12) | • As `employee-1@`, submit one request naming Supervisor 1 and one naming Supervisor 2<br>• Log in as `supervisor-1@budiman.com`: only the first is in "Waiting for your decision"; click **Sign** → success, status *Signed*<br>• Log in as `supervisor-2@budiman.com` (private window): the signed request is nowhere in their lists |
| To do | AC-17 | Supervisor rejection needs a remark and is final (U12) | • As `supervisor-2@`, open the request naming them, choose **Reject** with an empty remark → refused with a clear message<br>• Reject again with remark "team short-handed this month" → status *Rejected by supervisor*<br>• As `employee-1@`: the row shows the rejection and the remark, and offers no further action |
| To do | AC-18 | Employee sends a signed request to HR (U13) | • As `employee-1@`, the *Signed* row shows a **Send to HR** button; rows in other statuses show none<br>• Click → confirmation → success; status *Pending HR*; the button is gone |
| To do | AC-19 | HR approves or rejects; the officer is recorded (U14) | • As `hr-1@budiman.com`, `/hr` shows the request in the HR queue; `hr-2@` in a private window sees the same queue<br>• hr-1 approves → status *Approved*, "Decided by HR 1"<br>• Send another request through to *Pending HR*; hr-2 rejects with no remark → refused; with a remark → *Rejected by HR*, "Decided by HR 2"; the employee sees the remark |
| To do | AC-20 | First HR decision wins (U14) | • Get a request to *Pending HR*; open `/hr` as hr-1 in one window and hr-2 in another<br>• hr-2 approves first<br>• hr-1 clicks approve → message "this request has already been decided"; the status stays *Approved* and still says "Decided by HR 2" |
| To do | AC-21 | HR cannot see requests before the HR stage (U15) | • As `employee-1@`, submit a new request (still *Pending supervisor*)<br>• hr-1 opens `/hr`: it is not in the HR queue and not in the Decided list<br>• After the supervisor signs and the employee sends it, it appears |
| To do | AC-22 | Lists show status, remark and duration (U15, U19) | • `employee-1@`'s list: the 2026-11-25 → 2026-12-03 request shows **9 days**; the AC-17 row shows *Rejected by supervisor* with its remark<br>• The supervisor's and HR's history lists likewise show status and remarks; the HR history names the deciding officer |
| To do | AC-23 | Admin sees everything, changes nothing (U17) | • As `admin@budiman.com`, open `/admin/leave`: every record from the tests above, newest first, remarks and officer visible<br>• Status filter → *Approved* shows only approvals<br>• The page has no Sign / Reject / Send / Withdraw buttons at all |
| To do | AC-24 | Every action confirms, then celebrates (U16) | • Walk through submit, Sign, Reject, Send to HR, HR approve, HR reject, Withdraw: each asks for confirmation — cancelling leaves everything unchanged — and shows a success message and the new status after |
| To do | AC-25 | Wrong role or wrong request refused server-side (U21) | • `supervisor-1@` opens `/employee/leave/new` → bounced to `/supervisor`<br>• `employee-1@` opens `/admin/leave` → bounced to `/employee`<br>• As supervisor-2, tamper with a decision form's hidden id to aim at a request assigned to supervisor-1 → the server refuses and the status is unchanged |
| To do | AC-26 | Withdraw only before the supervisor acts (U18) | • As `employee-1@`, submit a fresh request and click **Withdraw** → confirmation → status *Withdrawn*, no further buttons<br>• On a *Signed* request there is no Withdraw button; a tampered attempt is refused by the server<br>• A request already decided or withdrawn can never be withdrawn |
| To do | AC-27 | Seed produces requests in every status (U20) | • Delete the SQLite file, run `npx prisma migrate dev` and `npx prisma db seed`<br>• As each role, the pages show demo requests covering all seven statuses (Pending supervisor, Signed, Pending HR, Approved, Rejected by supervisor, Rejected by HR, Withdrawn)<br>• Re-run the seed → still no duplicates |
| To do | AC-28 | A rejection is final; a re-apply is free (U11) | • After AC-17's rejection, `employee-1@` immediately submits a new request with the same type, dates and supervisor → accepted as a new *Pending supervisor* row<br>• The rejected row keeps its status and remark unchanged (interview: no duplicate blocking) |

## 5. Not included (for now)

- Leave balances or quotas — the brief keeps no allowance data
- Work-day calendars: weekends and holidays are **not** deducted, no
  half days (U19 keeps it to calendar days)
- Editing a request after submit — withdraw (U18) is the only exit
- Changing the chosen supervisor; an employee never picks anyone outside
  their own division
- Blocking duplicate or overlapping requests (AC-28 allows re-applying)
- Email or any notification — roles find out by opening their page
- Printing, PDF export, attachments, search boxes, charts, pagination —
  the Admin table (AC-23) is the only extra view
- Leave for Supervisors, HR or Admin — only the Employee role submits
