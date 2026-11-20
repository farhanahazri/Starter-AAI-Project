"use server";
// Leave module mutations (Leave design §6, rules 1–7; leave tasks 3–10).
// Every action re-checks the role on the server itself — page guards are
// decoration only (OWASP; same pattern as actions/users.ts). Status,
// remarks and officer fields are server-set; the client sends only
// references (ids) and its own change.
// (Next 16: "use server" files may only export async functions, so the
// state type below is a type-only export and messages live in lib.)
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { requireRole } from "@/app/lib/dal";
import {
  MOVES,
  REMARK_MAX_LENGTH,
  canTransition,
  isLeaveType,
  parseLeaveDate,
  readLeaveForm,
  validateLeaveFields,
  type LeaveAction,
} from "@/app/lib/leave";
import {
  LEAVE_ALREADY_DECIDED,
  LEAVE_APPROVED_SUCCESS,
  LEAVE_CHOOSE_DECISION,
  LEAVE_NOT_FOUND,
  LEAVE_NOT_SENDABLE,
  LEAVE_NOT_WITHDRAWABLE,
  LEAVE_NOT_YOUR_DECISION,
  LEAVE_REJECTED_BY_HR_SUCCESS,
  LEAVE_REJECTED_BY_SUPERVISOR_SUCCESS,
  LEAVE_REMARK_REQUIRED,
  LEAVE_SENT_TO_HR_SUCCESS,
  LEAVE_SIGNED_SUCCESS,
  LEAVE_SUBMITTED_SUCCESS,
  LEAVE_WITHDRAWN_SUCCESS,
} from "@/app/lib/messages";

export type LeaveActionState =
  | { errors?: string[]; success?: string }
  | undefined;

/** Employee submits a request (U11, AC-14/15; Leave design rule 1).
 * Every field is validated on the server — dropdown values are
 * untrusted (AC-15); the supervisor must be active, a SUPERVISOR and in
 * the requester's own division. */
export async function createLeave(
  _prevState: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const employee = await requireRole("EMPLOYEE");
  const values = readLeaveForm(formData);
  const errors = validateLeaveFields(values);
  if (errors.length) return { errors };
  if (!isLeaveType(values.leaveType)) {
    // validateLeaveFields already refuses unknown types; this narrows.
    return { errors: ["Leave type must be one of the listed types."] };
  }
  const startDate = parseLeaveDate(values.startDate);
  const endDate = parseLeaveDate(values.endDate);
  if (!startDate || !endDate) {
    return { errors: ["Start and end date must be real dates."] };
  }

  const supervisorId = Number(formData.get("supervisorId"));
  const supervisor = await prisma.user.findUnique({
    where: { id: Number.isInteger(supervisorId) ? supervisorId : -1 },
  });
  if (
    !supervisor ||
    !supervisor.active ||
    supervisor.role !== "SUPERVISOR" ||
    supervisor.division !== employee.division
  ) {
    return {
      errors: ["Please choose an active supervisor from your own division."],
    };
  }

  await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      supervisorId: supervisor.id,
      leaveType: values.leaveType,
      otherLeaveType:
        values.leaveType === "OTHER" ? values.otherLeaveType.trim() : null,
      startDate,
      endDate,
    },
  });
  revalidatePath("/employee"); // the list shows the new row (AC-14)
  return { success: LEAVE_SUBMITTED_SUCCESS };
}

/** The named supervisor signs or rejects (U12, AC-16/17/25; Leave design
 * rules 3–4). The row is re-read and the legal "From" status re-checked
 * twice — once here for a clear message, once in the conditional update
 * so a concurrent action cannot slip between the two. Only the supervisor
 * whose id is on the row may decide; tampering with the hidden id hits
 * the supervisorId filter. Sign sets signedAt; reject requires a 1–500
 * char remark stored in supervisorRemark. */
export async function supervisorDecide(
  _prevState: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const supervisor = await requireRole("SUPERVISOR");
  const id = Number(formData.get("leaveId"));
  if (!Number.isInteger(id)) return { errors: [LEAVE_NOT_FOUND] };
  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row) return { errors: [LEAVE_NOT_FOUND] };
  if (row.supervisorId !== supervisor.id) {
    return { errors: [LEAVE_NOT_YOUR_DECISION] };
  }
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "sign" && decision !== "reject") {
    return { errors: [LEAVE_CHOOSE_DECISION] };
  }
  const remark = String(formData.get("remark") ?? "").trim();
  if (decision === "reject" && (remark.length < 1 || remark.length > REMARK_MAX_LENGTH)) {
    return { errors: [LEAVE_REMARK_REQUIRED] };
  }
  const move: LeaveAction =
    decision === "sign" ? "supervisor-sign" : "supervisor-reject";
  if (!canTransition(move, row.status)) {
    return { errors: [LEAVE_ALREADY_DECIDED] };
  }
  const changed = await prisma.leaveRequest.updateMany({
    where: { id, supervisorId: supervisor.id, status: MOVES[move].from },
    data:
      decision === "sign"
        ? { status: MOVES[move].to, signedAt: new Date() }
        : { status: MOVES[move].to, supervisorRemark: remark },
  });
  if (changed.count === 0) return { errors: [LEAVE_ALREADY_DECIDED] };
  revalidatePath("/supervisor");
  revalidatePath("/employee"); // the employee sees the new status/remark
  return {
    success:
      decision === "sign"
        ? LEAVE_SIGNED_SUCCESS
        : LEAVE_REJECTED_BY_SUPERVISOR_SUCCESS,
  };
}

/** The owner sends their SIGNED request to the shared HR queue
 * (U13, AC-18; Leave design rule 5). Owner-only and SIGNED-only, both
 * re-checked here and encoded in the conditional update. A foreign id
 * reports "no longer exists" so the action never confirms other people's
 * rows exist. */
export async function sendToHr(
  _prevState: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const employee = await requireRole("EMPLOYEE");
  const id = Number(formData.get("leaveId"));
  if (!Number.isInteger(id)) return { errors: [LEAVE_NOT_FOUND] };
  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row || row.employeeId !== employee.id) {
    return { errors: [LEAVE_NOT_FOUND] };
  }
  if (!canTransition("send-to-hr", row.status)) {
    return { errors: [LEAVE_NOT_SENDABLE] };
  }
  const changed = await prisma.leaveRequest.updateMany({
    where: { id, employeeId: employee.id, status: MOVES["send-to-hr"].from },
    data: { status: MOVES["send-to-hr"].to },
  });
  if (changed.count === 0) return { errors: [LEAVE_ALREADY_DECIDED] };
  revalidatePath("/employee");
  revalidatePath("/hr");
  return { success: LEAVE_SENT_TO_HR_SUCCESS };
}

/** Any active HR officer decides a row in the shared queue (U14,
 * AC-19/20/21; Leave design rule 6). The write is conditional on
 * id AND status = PENDING_HR: if zero rows change, another officer
 * decided first — the loser is told "already decided" and nothing else
 * moves (first decision wins, AC-20). Success records hrOfficerId = me
 * and decidedAt = now; reject requires a 1–500 char hrRemark. */
export async function hrDecide(
  _prevState: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const officer = await requireRole("HR");
  const id = Number(formData.get("leaveId"));
  if (!Number.isInteger(id)) return { errors: [LEAVE_NOT_FOUND] };
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject") {
    return { errors: [LEAVE_CHOOSE_DECISION] };
  }
  const remark = String(formData.get("remark") ?? "").trim();
  if (decision === "reject" && (remark.length < 1 || remark.length > REMARK_MAX_LENGTH)) {
    return { errors: [LEAVE_REMARK_REQUIRED] };
  }
  const move: LeaveAction = decision === "approve" ? "hr-approve" : "hr-reject";
  const changed = await prisma.leaveRequest.updateMany({
    where: { id, status: MOVES[move].from },
    data:
      decision === "approve"
        ? { status: MOVES[move].to, hrOfficerId: officer.id, decidedAt: new Date() }
        : {
            status: MOVES[move].to,
            hrOfficerId: officer.id,
            hrRemark: remark,
            decidedAt: new Date(),
          },
  });
  if (changed.count === 0) return { errors: [LEAVE_ALREADY_DECIDED] };
  revalidatePath("/hr");
  revalidatePath("/employee");
  return {
    success:
      decision === "approve"
        ? LEAVE_APPROVED_SUCCESS
        : LEAVE_REJECTED_BY_HR_SUCCESS,
  };
}

/** The owner withdraws one of their own PENDING_SUPERVISOR requests
 * (U18, AC-26; Leave design rule 7). Owner-only, and once the supervisor
 * has acted there is no way back — the legal "From" and the owner id are
 * both in the conditional update. A foreign id reports "no longer
 * exists" so other people's rows are never confirmed. */
export async function withdrawLeave(
  _prevState: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const employee = await requireRole("EMPLOYEE");
  const id = Number(formData.get("leaveId"));
  if (!Number.isInteger(id)) return { errors: [LEAVE_NOT_FOUND] };
  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row || row.employeeId !== employee.id) {
    return { errors: [LEAVE_NOT_FOUND] };
  }
  if (!canTransition("withdraw", row.status)) {
    return { errors: [LEAVE_NOT_WITHDRAWABLE] };
  }
  const changed = await prisma.leaveRequest.updateMany({
    where: { id, employeeId: employee.id, status: MOVES.withdraw.from },
    data: { status: MOVES.withdraw.to, withdrawnAt: new Date() },
  });
  if (changed.count === 0) return { errors: [LEAVE_ALREADY_DECIDED] };
  revalidatePath("/employee");
  revalidatePath("/supervisor");
  return { success: LEAVE_WITHDRAWN_SUCCESS };
}
