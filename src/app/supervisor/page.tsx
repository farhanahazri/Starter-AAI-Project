import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";

export const metadata: Metadata = { title: "Supervisor – Budiman HRMS" };

// Placeholder until the leave-request spec (docs/specs/02-design.md §4).
export default async function SupervisorHome() {
  await requireRole("SUPERVISOR", "/supervisor");
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Supervisor home</h1>
      <p className="mt-2 text-gray-600">
        Requests waiting for your signature will appear here.
      </p>
    </main>
  );
}
