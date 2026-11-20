// The single source of leave constants and rules (Leave design §2,
// rules 1–2; leave task 2). Pure module: the pages and server actions
// import from here, so no page or action invents its own values.
// Field-shape checks live here; checks that need the database
// (supervisor id/division, uniqueness) live in the actions, mirroring
// lib/validation.ts + actions/users.ts from the login module.

// Reference C. Leave types (brief §7.2). SQLite has no enum: text
// values checked against this allowlist.
export const LEAVE_TYPES = [
  "ANNUAL",
  "MATERNITY",
  "UNPAID",
  "COMPASSIONATE",
  "OTHER",
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Annual leave",
  MATERNITY: "Maternity leave",
  UNPAID: "Unpaid leave",
  COMPASSIONATE: "Compassionate leave",
  OTHER: "Other",
};

// Reference D. Statuses (brief §5.2 + WITHDRAWN from the interview).
export const LEAVE_STATUSES = [
  "PENDING_SUPERVISOR",
  "SIGNED",
  "PENDING_HR",
  "APPROVED",
  "REJECTED_BY_SUPERVISOR",
  "REJECTED_BY_HR",
  "WITHDRAWN",
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING_SUPERVISOR: "Pending supervisor",
  SIGNED: "Signed",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED_BY_SUPERVISOR: "Rejected by supervisor",
  REJECTED_BY_HR: "Rejected by HR",
  WITHDRAWN: "Withdrawn",
};

export function isLeaveType(value: string): value is LeaveType {
  return (LEAVE_TYPES as readonly string[]).includes(value);
}

export function isLeaveStatus(value: string): value is LeaveStatus {
  return (LEAVE_STATUSES as readonly string[]).includes(value);
}

// The moves table (Leave design §2): the only legal status changes.
// The actions' conditional updates encode the same rule against the DB.
export const MOVES = {
  "supervisor-sign": { from: "PENDING_SUPERVISOR", to: "SIGNED" },
  "supervisor-reject": {
    from: "PENDING_SUPERVISOR",
    to: "REJECTED_BY_SUPERVISOR",
  },
  withdraw: { from: "PENDING_SUPERVISOR", to: "WITHDRAWN" },
  "send-to-hr": { from: "SIGNED", to: "PENDING_HR" },
  "hr-approve": { from: "PENDING_HR", to: "APPROVED" },
  "hr-reject": { from: "PENDING_HR", to: "REJECTED_BY_HR" },
} as const satisfies Record<
  string,
  { from: LeaveStatus; to: LeaveStatus }
>;
export type LeaveAction = keyof typeof MOVES;

/** True only for the legal "From" of the action (Leave design rule 3). */
export function canTransition(
  action: LeaveAction,
  currentStatus: string,
): boolean {
  const move = (MOVES as Record<string, { from: LeaveStatus; to: LeaveStatus }>)[
    action
  ];
  return move !== undefined && move.from === currentStatus;
}

export const OTHER_TYPE_MIN_LENGTH = 1;
export const OTHER_TYPE_MAX_LENGTH = 200;
export const REMARK_MAX_LENGTH = 500;

export type LeaveFormValues = {
  leaveType: string;
  otherLeaveType: string;
  startDate: string; // "YYYY-MM-DD" from a date input
  endDate: string;
};

export function readLeaveForm(formData: FormData): LeaveFormValues {
  return {
    leaveType: String(formData.get("leaveType") ?? ""),
    otherLeaveType: String(formData.get("otherLeaveType") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    endDate: String(formData.get("endDate") ?? "").trim(),
  };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a date-only input as UTC midnight (Leave design rule 2, my
 * call) so durations are exact on every machine. Invalid → null. */
export function parseLeaveDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject values JS would silently roll over, e.g. 2026-02-31.
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

/** Field errors in plain words (AC-15); empty array means the input is
 * good. The supervisor id is checked against the DB by the action. */
export function validateLeaveFields(v: LeaveFormValues): string[] {
  const errors: string[] = [];
  if (!isLeaveType(v.leaveType)) {
    errors.push("Leave type must be one of the listed types.");
  }
  if (v.leaveType === "OTHER") {
    const text = v.otherLeaveType.trim();
    if (
      text.length < OTHER_TYPE_MIN_LENGTH ||
      text.length > OTHER_TYPE_MAX_LENGTH
    ) {
      errors.push(
        `Please say what the leave is for (1–${OTHER_TYPE_MAX_LENGTH} characters).`,
      );
    }
  }
  const start = parseLeaveDate(v.startDate);
  const end = parseLeaveDate(v.endDate);
  if (!start) errors.push("Start date must be a real date.");
  if (!end) errors.push("End date must be a real date.");
  // Past dates allowed (interview); the only rule is end >= start.
  if (start && end && end.getTime() < start.getTime()) {
    errors.push("The end date cannot be before the start date.");
  }
  return errors;
}

/** Calendar days, both ends included (U19): 25 Nov → 3 Dec = 9.
 * Computed at render, never stored (Leave design rule 2). */
export function durationDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
