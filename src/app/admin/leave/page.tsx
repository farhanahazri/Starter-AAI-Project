import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import { isLeaveStatus } from "@/app/lib/leave";
import AdminLeaveTable, { type AdminLeaveRow } from "@/components/AdminLeaveTable";

export const metadata: Metadata = { title: "All leave records – Budiman HRMS" };

// "All leave records" (Leave design §4, rule 8; leave task 9): every
// record, newest first, one status filter — read-only (FR-08). The
// filter value is validated against Reference D on the server; anything
// else simply means "All".
const NEWEST_FIRST = [{ submittedAt: "desc" }, { id: "desc" }] as const;

export default async function AdminLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN", "/admin/leave");
  const { status } = await searchParams;
  const activeStatus = status && isLeaveStatus(status) ? status : "";
  const requests = await prisma.leaveRequest.findMany({
    where: activeStatus ? { status: activeStatus } : {},
    orderBy: [...NEWEST_FIRST],
  });
  const userIds = [
    ...new Set(
      requests.flatMap((r) => [r.employeeId, r.supervisorId, r.hrOfficerId ?? -1]),
    ),
  ];
  const people =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, division: true },
        })
      : [];
  const byId = new Map(people.map((p) => [p.id, p]));
  const rows: AdminLeaveRow[] = requests.map((r) => ({
    id: r.id,
    employeeName: byId.get(r.employeeId)?.name ?? "Unknown",
    division: byId.get(r.employeeId)?.division ?? "",
    leaveType: r.leaveType,
    otherLeaveType: r.otherLeaveType,
    startDate: r.startDate,
    endDate: r.endDate,
    supervisorName: byId.get(r.supervisorId)?.name ?? "Unknown",
    status: r.status,
    hrOfficerName: r.hrOfficerId ? byId.get(r.hrOfficerId)?.name ?? null : null,
    supervisorRemark: r.supervisorRemark,
    hrRemark: r.hrRemark,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-white">All leave records</h1>
      <p className="mt-1 text-sm">
        <Link href="/admin" className="text-mint underline hover:text-white">
          ← Admin home
        </Link>
      </p>
      {/* White card like /admin/users (design §4): data stays readable. */}
      <div className="mt-6 rounded-lg border border-gray-300 bg-white p-4 text-gray-900 shadow">
        <AdminLeaveTable rows={rows} activeStatus={activeStatus} />
      </div>
    </main>
  );
}
