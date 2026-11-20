import { logout } from "@/app/actions/auth";

// Shown by the root layout only when signed in (docs/specs/02-design.md §5).
// Log out is a plain form posting to the logout server action — no page
// behind it (design §4).
export default function Header({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <span className="font-semibold text-gray-900">Budiman HRMS</span>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">Signed in as {name}</span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
