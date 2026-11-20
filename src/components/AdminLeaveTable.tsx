// The Admin's read-only leave table (Leave design §4 `/admin/leave`,
// rule 8, FR-08; leave task 9): Employee · Division · Type · Dates
// (+ days) · Supervisor · Status · HR officer · remarks. White card,
// like /admin/users, so data stays readable on the dark shell. There are
// deliberately NO buttons that change anything — the Admin only reads.
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUSES,
  LEAVE_TYPE_LABELS,
  durationDays,
  isLeaveStatus,
  isLeaveType,
} from "@/app/lib/leave";

export type AdminLeaveRow = {
  id: number;
  employeeName: string;
  division: string;
  leaveType: string;
  otherLeaveType: string | null;
  startDate: Date;
  endDate: Date;
  supervisorName: string;
  status: string;
  hrOfficerName: string | null;
  supervisorRemark: string | null;
  hrRemark: string | null;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function typeLabel(row: AdminLeaveRow): string {
  const base = isLeaveType(row.leaveType)
    ? LEAVE_TYPE_LABELS[row.leaveType]
    : row.leaveType;
  return row.leaveType === "OTHER" && row.otherLeaveType
    ? `${base} — ${row.otherLeaveType}`
    : base;
}

function statusLabel(status: string): string {
  return isLeaveStatus(status) ? LEAVE_STATUS_LABELS[status] : status;
}

const th = "py-2 pr-4 font-medium";
const td = "py-2 pr-4 text-gray-700";

export default function AdminLeaveTable({
  rows,
  activeStatus,
}: {
  rows: AdminLeaveRow[];
  activeStatus: string; // "" = every status
}) {
  return (
    <div>
      {/* Server-side dropdown filter: plain GET form, works without JS. */}
      <form method="GET" className="mb-3 flex items-center gap-2 text-sm">
        <label htmlFor="status" className="font-medium text-gray-900">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={activeStatus}
          className="rounded border border-gray-300 bg-white px-2 py-1"
        >
          <option value="">All</option>
          {LEAVE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAVE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded border border-gray-300 bg-gray-50 px-3 py-1 hover:bg-gray-100"
        >
          Filter
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className={th}>Employee</th>
              <th className={th}>Division</th>
              <th className={th}>Type</th>
              <th className={th}>Dates</th>
              <th className={th}>Supervisor</th>
              <th className={th}>Status</th>
              <th className={th}>HR officer</th>
              <th className="py-2 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 align-top">
                <td className={`${td} font-medium text-gray-900`}>
                  {row.employeeName}
                </td>
                <td className={td}>{row.division}</td>
                <td className={td}>{typeLabel(row)}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {formatDate(row.startDate)} → {formatDate(row.endDate)} (
                  {durationDays(row.startDate, row.endDate)} days)
                </td>
                <td className={td}>{row.supervisorName}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {statusLabel(row.status)}
                </td>
                <td className={td}>{row.hrOfficerName ?? ""}</td>
                <td className={td}>
                  {[row.supervisorRemark, row.hrRemark]
                    .filter((r): r is string => Boolean(r))
                    .join(" / ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-4 text-sm text-gray-500">
            No leave requests match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
