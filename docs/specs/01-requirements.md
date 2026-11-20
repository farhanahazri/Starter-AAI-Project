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
