import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import { hrDecide } from "@/app/actions/leave";
import LeaveRows, { type LeaveRowData } from "@/components/LeaveRows";
import DecisionButtons from "@/components/DecisionButtons";

export const metadata: Metadata = { title: "HR – Budiman HRMS" };

// HR home (Leave design §4, rules 6/8; leave task 7): the shared queue is
// every PENDING_HR row — any active officer decides it, first decision
// wins (rule 6). "Decided" shows APPROVED and REJECTED_BY_HR rows naming
// the deciding officer. Requests still at the supervisor stage are
// invisible here — the query only asks for these three statuses (rule 8).
const NEWEST_FIRST = [{ submittedAt: "desc" }, { id: "desc" }] as const;

export default async function HrHome() {
  await requireRole("HR", "/hr");
  const [queue, decided] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "PENDING_HR" },
      orderBy: [...NEWEST_FIRST],
    }),
    prisma.leaveRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED_BY_HR"] } },
      orderBy: [...NEWEST_FIRST],
    }),
  ]);
  const userIds = [
    ...new Set(
      [...queue, ...decided].flatMap((r) => [
        r.employeeId,
        r.supervisorId,
        r.hrOfficerId ?? -1,
      ]),
    ),
  ];
  const people =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(people.map((p) => [p.id, p.name]));
  const toRows = (rows: typeof queue): LeaveRowData[] =>
    rows.map((r) => ({
      id: r.id,
      employeeName: nameById.get(r.employeeId) ?? "Unknown",
      hrOfficerName: r.hrOfficerId ? nameById.get(r.hrOfficerId) : undefined,
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
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-16">
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h1 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          HR queue
        </h1>
        <div className="p-8">
          {queue.length === 0 ? (
            <p className="text-sm leading-6 text-slate-300">
              The HR queue is empty — nothing was sent to HR yet.
            </p>
          ) : (
            <LeaveRows
              rows={toRows(queue)}
              showEmployee
              renderActions={(row) => (
                <DecisionButtons
                  id={row.id}
                  decide={hrDecide}
                  signLabel="Approve"
                  signValue="approve"
                  confirmSign="Approve this request?"
                  confirmReject="Reject this request?"
                />
              )}
            />
          )}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h2 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          Decided
        </h2>
        <div className="p-8">
          {decided.length === 0 ? (
            <p className="text-sm leading-6 text-slate-300">
              No requests have been decided by HR yet.
            </p>
          ) : (
            <LeaveRows rows={toRows(decided)} showEmployee showOfficer />
          )}
        </div>
      </section>
    </main>
  );
}
