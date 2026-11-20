# Budiman HRMS – Project rules

## What this is
A Leave Request module for Budiman Company (~200 employees), replacing the
paper leave form. Roles: Employee, Supervisor, HR, Admin. The brief and the
data it needs live in `docs/Agentic AI - HRMS Doc.pdf` — read it before
building anything.

## Built with
Next.js 16 with TypeScript (App Router, server actions), SQLite via Prisma,
Tailwind CSS. Login is a signed session cookie; passwords are hashed with
bcryptjs. Versions are pinned in `package.json` — do not upgrade or add
libraries without asking first.

## How to run
`npm install`, then `npm run dev` → http://localhost:3000. Check code with
`npm run lint`. Needs Node 20 or newer.

## Where things live
- `docs/` – the HRMS document (the brief) and the spec workflow.
- `docs/templates/` – blank spec files; copy them to `docs/specs/` and fill in.
- `src/app/` – all pages and server code. `page.tsx` is a placeholder to replace.
- `prisma/` – the database schema (to be created).

## How to work
- Spec-driven: agree the specs in `docs/specs/` first (01-requirements →
  02-design → 03-tasks), then build from them. If code and spec disagree,
  fix the spec first, then the code.
- Build one task at a time, in order, High priority first. Extra ideas are
  Low priority — only with an approved spec.
- Security is part of every task (OWASP Top 10): check the role on every
  page, re-check it on the server for every action, never store or log
  plain-text passwords.
- Every commit message uses Conventional Commits, e.g. `feat: add login
  page`, `fix: require remark on reject`, `docs: update specs`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
