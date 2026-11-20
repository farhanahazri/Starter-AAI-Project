import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";

export const metadata: Metadata = { title: "Admin – Budiman HRMS" };

// Placeholder until the leave-request spec (docs/specs/02-design.md §4).
export default async function AdminHome() {
  await requireRole("ADMIN", "/admin");
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Admin home</h1>
      <p className="mt-2 text-gray-600">
        Every leave record (view only) will appear here. User management lives
        at <a className="underline" href="/admin/users">/admin/users</a>.
      </p>
    </main>
  );
}
