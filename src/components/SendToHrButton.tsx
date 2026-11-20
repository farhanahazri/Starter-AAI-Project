"use client";
// The contextual **Send to HR** button (Leave design rule 5, AC-18;
// leave task 6). Shown by /employee only on *Signed* rows; the action
// re-checks owner + SIGNED on the server. Confirm first (rule 10).
import { useActionState } from "react";
import type { LeaveActionState } from "@/app/actions/leave";

export default function SendToHrButton({
  id,
  send,
}: {
  id: number;
  send: (state: LeaveActionState, formData: FormData) => Promise<LeaveActionState>;
}) {
  const [state, action, pending] = useActionState<LeaveActionState, FormData>(
    send,
    undefined,
  );
  return (
    <div>
      <form
        action={action}
        onSubmit={(event) => {
          if (!window.confirm("Send this request to HR?")) event.preventDefault();
        }}
        className="inline-flex items-center gap-1"
      >
        <input type="hidden" name="leaveId" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-deep disabled:opacity-50"
        >
          Send to HR
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
