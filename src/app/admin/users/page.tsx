import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import UsersTable from "@/components/UsersTable";
import AddUserForm from "@/components/AddUserForm";

export const metadata: Metadata = { title: "Users – Budiman HRMS" };

// Admin user management (docs/specs/02-design.md §4, rule 7). The guard is
// the door; the actions re-check ADMIN themselves. The select list is
// explicit so passwordHash never leaves the server layer (rule 9).
export default async function AdminUsersPage() {
  await requireRole("ADMIN", "/admin/users");
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      designation: true,
      active: true,
      lockedUntil: true,
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="mt-1 text-sm text-gray-600">
        <Link href="/admin" className="text-blue-700 underline hover:text-blue-900">
          ← Admin home
        </Link>
      </p>
      <div className="mt-6 rounded-lg border border-gray-300 bg-white p-4 shadow">
        <UsersTable users={users} />
      </div>
      <h2 className="mt-10 text-lg font-semibold text-gray-900">Add a user</h2>
      <AddUserForm />
    </main>
  );
}
