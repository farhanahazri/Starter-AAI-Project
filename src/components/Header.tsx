import { logout } from "@/app/actions/auth";

// Shown by the root layout only when signed in (docs/specs/02-design.md §5).
// Look per §4 "Look and feel": night bar with mint accents. Log out is a
// plain form posting to the logout server action — no page behind it
// (design §4).
export default function Header({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-night/90 px-4 py-3 backdrop-blur">
      <span className="font-semibold uppercase tracking-[0.2em] text-mint">
        Budiman HRMS
      </span>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-300">Signed in as {name}</span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-mint/50 px-3 py-1 text-mint hover:bg-mint/10"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
