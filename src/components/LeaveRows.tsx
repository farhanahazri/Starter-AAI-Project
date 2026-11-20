// Shared leave-row table (Leave design §4): the employee list, the
// supervisor queues and the HR queue render the same columns — type
// (+ "what it's for" for Other), dates with "N days", supervisor,
// status badge, remark. Presentational only: it never queries the
// database and never mutates (leave task 4).
import type { ReactNode } from "react";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  durationDays,
  isLeaveStatus,
  isLeaveType,
  type LeaveStatus,
} from "@/app/lib/leave";

export type LeaveRowData = {
  id: number;
  employeeName?: string; // shown when the viewer is not the employee
  hrOfficerName?: string; // "Decided by …" on the HR history (rule 8)
  leaveType: string;
  otherLeaveType: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  supervisorRemark: string | null;
  hrRemark: string | null;
  supervisorName: string;
};

// One badge colour per status, on the navy card (Leave design §4 look
// and feel). Labels come from lib/leave — never invented here.
const BADGE_CLASSES: Record<LeaveStatus, string> = {
  PENDING_SUPERVISOR: "border-amber-300/40 bg-amber-400/15 text-amber-200",
  SIGNED: "border-sky-300/40 bg-sky-400/15 text-sky-200",
  PENDING_HR: "border-amber-300/40 bg-amber-400/15 text-amber-200",
  APPROVED: "border-mint/40 bg-brand/20 text-mint",
  REJECTED_BY_SUPERVISOR: "border-red-400/40 bg-red-400/15 text-[#FCA5A5]",
  REJECTED_BY_HR: "border-red-400/40 bg-red-400/15 text-[#FCA5A5]",
  WITHDRAWN: "border-slate-400/40 bg-slate-400/15 text-slate-300",
};

// Dates were stored as UTC midnights (design rule 2), so the ISO text
// is the date the employee picked — no timezone drift.
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function StatusBadge({ status }: { status: string }) {
  const label = isLeaveStatus(status) ? LEAVE_STATUS_LABELS[status] : status;
  const classes = isLeaveStatus(status)
    ? BADGE_CLASSES[status]
    : "border-slate-400/40 bg-slate-400/15 text-slate-300";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function typeLabel(row: LeaveRowData): string {
  const base = isLeaveType(row.leaveType)
    ? LEAVE_TYPE_LABELS[row.leaveType]
    : row.leaveType;
  // "what it's for" shows only for Other (rule 1).
  if (row.leaveType === "OTHER" && row.otherLeaveType) {
    return `${base} — ${row.otherLeaveType}`;
  }
  return base;
}

export default function LeaveRows({
  rows,
  showEmployee = false,
  showOfficer = false,
  renderActions,
}: {
  rows: LeaveRowData[];
  showEmployee?: boolean; // queues show whose request it is
  showOfficer?: boolean; // HR history: "Decided by {name}"
  renderActions?: (row: LeaveRowData) => ReactNode; // Sign/Reject, Send to HR…
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-mint/25 text-xs uppercase tracking-[0.15em] text-slate-400">
            {showEmployee && (
              <th className="py-2 pr-4 font-medium">Employee</th>
            )}
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Dates</th>
            <th className="py-2 pr-4 font-medium">Supervisor</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {showOfficer && (
              <th className="py-2 pr-4 font-medium">Decided by</th>
            )}
            <th className={renderActions ? "py-2 pr-4 font-medium" : "py-2 font-medium"}>
              Remark
            </th>
            {renderActions && <th className="py-2 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-mint/15 align-top">
              {showEmployee && (
                <td className="py-2 pr-4 text-slate-100">
                  {row.employeeName ?? ""}
                </td>
              )}
              <td className="py-2 pr-4 text-slate-100">{typeLabel(row)}</td>
              <td className="py-2 pr-4 whitespace-nowrap text-slate-300">
                {formatDate(row.startDate)} → {formatDate(row.endDate)}{" "}
                <span className="text-mint">
                  ({durationDays(row.startDate, row.endDate)} days)
                </span>
              </td>
              <td className="py-2 pr-4 text-slate-300">{row.supervisorName}</td>
              <td className="py-2 pr-4">
                <StatusBadge status={row.status} />
              </td>
              {showOfficer && (
                <td className="py-2 pr-4 text-slate-300">
                  {row.hrOfficerName ?? "—"}
                </td>
              )}
              <td className={renderActions ? "py-2 pr-4 text-slate-300" : "py-2 text-slate-300"}>
                {row.hrRemark ?? row.supervisorRemark ?? ""}
              </td>
              {renderActions && (
                <td className="py-2 whitespace-nowrap">
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
