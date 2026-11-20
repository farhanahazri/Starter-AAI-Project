// User-visible strings kept out of "use server" files — Next 16 allows only
// async function exports there.
export const GENERIC_LOGIN_ERROR = "Email or password is incorrect";

// Leave module strings (Leave design rule 10). One place, so no
// user-visible text ends up in the "use server" file.
export const LEAVE_SUBMITTED_SUCCESS =
  "Leave request submitted — it is now waiting for your supervisor.";
export const LEAVE_ALREADY_DECIDED =
  "This request has already been decided.";
export const LEAVE_SIGNED_SUCCESS =
  "Request signed — the employee can now send it to HR.";
export const LEAVE_REJECTED_BY_SUPERVISOR_SUCCESS =
  "Request rejected — your remark was saved.";
export const LEAVE_SENT_TO_HR_SUCCESS =
  "Request sent to HR — you can track it in your list.";
export const LEAVE_APPROVED_SUCCESS =
  "Request approved — the employee can see it in their list.";
export const LEAVE_REJECTED_BY_HR_SUCCESS =
  "Request rejected — your remark was saved.";
export const LEAVE_WITHDRAWN_SUCCESS =
  "Request withdrawn.";
export const LEAVE_NOT_FOUND = "This request no longer exists.";
export const LEAVE_NOT_YOUR_DECISION =
  "Only the supervisor named on this request can decide it.";
export const LEAVE_CHOOSE_DECISION =
  "Please choose to sign or reject the request.";
export const LEAVE_REMARK_REQUIRED =
  "Please give a short reason for the rejection (1–500 characters).";
export const LEAVE_NOT_SENDABLE =
  "Only a signed request can be sent to HR.";
export const LEAVE_NOT_WITHDRAWABLE =
  "A request can only be withdrawn while it is waiting for your supervisor.";
