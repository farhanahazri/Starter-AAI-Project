import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";
import LeaveForm from "@/components/LeaveForm";

export const metadata: Metadata = {
  title: "New leave request – Budiman HRMS",
};

// The request form (Leave design §4; leave task 3). The supervisor
// dropdown is built on the server from the employee's own division,
// active SUPERVISOR users only — createLeave checks it again anyway
// (AC-15, server rule 1). Card look per the login §4 "Look and feel".
export default async function NewLeaveRequestPage() {
  const employee = await requireRole("EMPLOYEE", "/employee/leave/new");
  const supervisors = await prisma.user.findMany({
    where: {
      role: "SUPERVISOR",
      active: true,
      division: employee.division,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h1 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          New leave request
        </h1>
        {supervisors.length === 0 ? (
          // My call, per the design §4 empty state: no supervisor, no submit.
          <p className="p-8 text-sm leading-6 text-slate-300">
            No supervisor is available in your division — please contact the
            Admin.
          </p>
        ) : (
          <LeaveForm supervisors={supervisors} />
        )}
      </section>
    </main>
  );
}
