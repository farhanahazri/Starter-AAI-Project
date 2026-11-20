"use client";
// The contextual **Withdraw** button (Leave design rule 7, AC-26; leave
// task 10). Shown by /employee only on *Pending supervisor* rows; the
// action re-checks owner + status on the server. Confirm first (rule 10).
import { useActionState } from "react";
import type { LeaveActionState } from "@/app/actions/leave";

export default function WithdrawButton({
  id,
  withdraw,
}: {
  id: number;
  withdraw: (state: LeaveActionState, formData: FormData) => Promise<LeaveActionState>;
}) {
  const [state, action, pending] = useActionState<LeaveActionState, FormData>(
    withdraw,
    undefined,
  );
  return (
    <div>
      <form
        action={action}
        onSubmit={(event) => {
          if (!window.confirm("Withdraw this request?")) event.preventDefault();
        }}
        className="inline-flex items-center gap-1"
      >
        <input type="hidden" name="leaveId" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-red-400/50 bg-red-400/15 px-3 py-1 text-xs font-semibold text-[#FCA5A5] hover:bg-red-400/25 disabled:opacity-50"
        >
          Withdraw
        </button>
      </form>
      {(state?.errors?.length ?? 0) > 0 && (
        <ul role="alert" className="mt-1 text-xs text-[#FCA5A5]">
          {state?.errors?.map((message) => <li key={message}>{message}</li>)}
        </ul>
      )}
      {state?.success && (
        <p role="status" className="mt-1 text-xs text-mint">
          {state.success}
        </p>
      )}
    </div>
  );
}
