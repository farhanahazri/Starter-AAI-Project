import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";

export const metadata: Metadata = { title: "Employee – Budiman HRMS" };

// Placeholder until the leave-request spec (docs/specs/02-design.md §4).
export default async function EmployeeHome() {
  await requireRole("EMPLOYEE", "/employee");
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Employee home</h1>
      <p className="mt-2 text-gray-600">
        Your leave requests will appear here once the leave module is built.
      </p>
    </main>
  );
}
