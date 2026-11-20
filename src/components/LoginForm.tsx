"use client";
// Email + password form posting to the login server action
// (docs/specs/01-requirements.md U1; design rule 6). Card look per design
// §4 "Look and feel" — mint "STAFF LOGIN" band, underline-only fields with
// mint icons, solid teal LOGIN button.
import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-mint" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-mint" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const fieldRow =
  "mt-1 flex items-center gap-2 border-b border-white/30 pb-2 focus-within:border-mint";
const fieldInput =
  "w-full bg-transparent text-white placeholder:text-slate-400 focus:outline-none";
const fieldLabel = "block text-xs font-medium uppercase tracking-wider text-slate-300";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="mx-auto mt-8 w-full max-w-sm overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40"
    >
      <div className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
        Staff login
      </div>
      <div className="space-y-5 p-8">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="email" className={fieldLabel}>
            Work email
          </label>
          <div className={fieldRow}>
            <MailIcon />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@budiman.com"
              className={fieldInput}
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className={fieldLabel}>
            Password
          </label>
          <div className={fieldRow}>
            <LockIcon />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className={fieldInput}
            />
          </div>
        </div>
        {state?.error && (
          <p role="alert" className="text-sm text-[#FCA5A5]">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-brand py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white hover:bg-brand-deep disabled:opacity-50"
        >
          {isPending ? "Logging in…" : "Log in"}
        </button>
      </div>
    </form>
  );
}
