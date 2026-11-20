import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import { sendToHr, withdrawLeave } from "@/app/actions/leave";
import LeaveRows, { type LeaveRowData } from "@/components/LeaveRows";
import SendToHrButton from "@/components/SendToHrButton";
import WithdrawButton from "@/components/WithdrawButton";

export const metadata: Metadata = { title: "Employee – Budiman HRMS" };

// "My leave requests" (Leave design §4, leave tasks 4+6): the employee's
// own rows only — the query is scoped by employeeId (design rule 8),
// newest first. Contextual button: Send to HR on *Signed* rows only (rule 5;
// the Withdraw button arrives with task 10). The server re-checks it all.
export default async function EmployeeHome() {
  const user = await requireRole("EMPLOYEE", "/employee");
  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: user.id }, // scoped: never another employee's rows
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
  });
  const supervisorIds = [...new Set(requests.map((r) => r.supervisorId))];
  const supervisors =
    supervisorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: supervisorIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(supervisors.map((s) => [s.id, s.name]));
  const rows: LeaveRowData[] = requests.map((r) => ({
    id: r.id,
    leaveType: r.leaveType,
    otherLeaveType: r.otherLeaveType,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
    supervisorRemark: r.supervisorRemark,
    hrRemark: r.hrRemark,
    supervisorName: nameById.get(r.supervisorId) ?? "Unknown",
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h1 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          My leave requests
        </h1>
        <div className="p-8">
          <a
            className="mb-6 inline-block w-fit rounded-md bg-brand px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-deep"
            href="/employee/leave/new"
          >
            New request
          </a>
          {rows.length === 0 ? (
            <p className="text-sm leading-6 text-slate-300">
              You have no leave requests yet — submit your first one with the
              button above.
            </p>
          ) : (
            <LeaveRows
              rows={rows}
              renderActions={
                rows.some(
                  (r) => r.status === "SIGNED" || r.status === "PENDING_SUPERVISOR",
                )
                  ? (row) =>
                      row.status === "SIGNED" ? (
                        <SendToHrButton id={row.id} send={sendToHr} />
                      ) : row.status === "PENDING_SUPERVISOR" ? (
                        <WithdrawButton id={row.id} withdraw={withdrawLeave} />
                      ) : null
                  : undefined
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}
