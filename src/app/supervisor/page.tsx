import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import { supervisorDecide } from "@/app/actions/leave";
import LeaveRows, { type LeaveRowData } from "@/components/LeaveRows";
import DecisionButtons from "@/components/DecisionButtons";

export const metadata: Metadata = { title: "Supervisor – Budiman HRMS" };

// Supervisor home (Leave design §4, rules 3–4/8; leave task 5): the queue
// is only PENDING_SUPERVISOR rows naming this supervisor; the history is
// everything else they were named on — what they signed (which may have
// moved on since) or rejected — each with its current status. Scoped in
// the query (design rule 8), not by hiding.
const NEWEST_FIRST = [{ submittedAt: "desc" }, { id: "desc" }] as const;

export default async function SupervisorHome() {
  const supervisor = await requireRole("SUPERVISOR", "/supervisor");
  const [queue, decided] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { supervisorId: supervisor.id, status: "PENDING_SUPERVISOR" },
      orderBy: [...NEWEST_FIRST],
    }),
    prisma.leaveRequest.findMany({
      where: {
        supervisorId: supervisor.id,
        status: { not: "PENDING_SUPERVISOR" },
      },
      orderBy: [...NEWEST_FIRST],
    }),
  ]);
  const employeeIds = [
    ...new Set([...queue, ...decided].map((r) => r.employeeId)),
  ];
  const employees =
    employeeIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(employees.map((e) => [e.id, e.name]));
  const toRows = (rows: typeof queue): LeaveRowData[] =>
    rows.map((r) => ({
      id: r.id,
      employeeName: nameById.get(r.employeeId) ?? "Unknown",
      leaveType: r.leaveType,
      otherLeaveType: r.otherLeaveType,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      supervisorRemark: r.supervisorRemark,
      hrRemark: r.hrRemark,
      supervisorName: supervisor.name,
    }));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-16">
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h1 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          Waiting for your decision
        </h1>
        <div className="p-8">
          {queue.length === 0 ? (
            <p className="text-sm leading-6 text-slate-300">
              Nothing is waiting for your decision.
            </p>
          ) : (
            <LeaveRows
              rows={toRows(queue)}
              showEmployee
              renderActions={(row) => (
                <DecisionButtons
                  id={row.id}
                  decide={supervisorDecide}
                  signLabel="Sign"
                  confirmSign="Sign this request?"
                  confirmReject="Reject this request?"
                />
              )}
            />
          )}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h2 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          Your decisions
        </h2>
        <div className="p-8">
          {decided.length === 0 ? (
            <p className="text-sm leading-6 text-slate-300">
              You have not signed or rejected any request yet.
            </p>
          ) : (
            <LeaveRows rows={toRows(decided)} showEmployee />
          )}
        </div>
      </section>
    </main>
  );
}
