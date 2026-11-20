"use client";
// Sign/Reject on the supervisor queue (Leave design rules 3–4, 10; leave
// task 5) — and, reused by task 7, Approve/Reject on the HR queue. One
// row, one message area: each row keeps its own state (useActionState).
// Every submit confirms first (AC-24); remark is required on reject.
// The server re-checks everything — this is convenience, not control.
import { useActionState } from "react";
import type { LeaveActionState } from "@/app/actions/leave";
import { REMARK_MAX_LENGTH } from "@/app/lib/leave";

type Props = {
  id: number;
  decide: (state: LeaveActionState, formData: FormData) => Promise<LeaveActionState>;
  signLabel: string; // "Sign" (supervisor) / "Approve" (HR)
  signValue?: "sign" | "approve"; // must match what the action expects
  confirmSign: string;
  confirmReject: string;
};

const fieldClass =
  "rounded border border-mint/25 bg-night-deep px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500";

export default function DecisionButtons({
  id,
  decide,
  signLabel,
  signValue = "sign",
  confirmSign,
  confirmReject,
}: Props) {
  const [state, action, pending] = useActionState<LeaveActionState, FormData>(
    decide,
    undefined,
  );
  return (
    <div>
      <div className="flex items-center gap-2">
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm(confirmSign)) event.preventDefault();
          }}
          className="inline-flex items-center gap-1"
        >
          <input type="hidden" name="leaveId" value={id} />
          <input type="hidden" name="decision" value={signValue} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-deep disabled:opacity-50"
          >
            {signLabel}
          </button>
        </form>
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm(confirmReject)) event.preventDefault();
          }}
          className="inline-flex items-center gap-1"
        >
          <input type="hidden" name="leaveId" value={id} />
          <input type="hidden" name="decision" value="reject" />
          <input
            type="text"
            name="remark"
            aria-label="Reason for rejection"
            placeholder="Reason (required)"
            minLength={1}
            maxLength={REMARK_MAX_LENGTH}
            required
            className={`w-36 ${fieldClass}`}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-red-400/50 bg-red-400/15 px-3 py-1 text-xs font-semibold text-[#FCA5A5] hover:bg-red-400/25 disabled:opacity-50"
          >
            Reject
          </button>
        </form>
      </div>
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
