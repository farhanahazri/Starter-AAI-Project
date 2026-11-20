"use client";
// The request form on /employee/leave/new (leave task 3; Leave design
// rule 1 + §4). Client checks (required fields, conditional "what it's
// for") are convenience — createLeave re-checks every value on the
// server (AC-15). Submit confirms first, success shows after (AC-24).
import { useActionState, useState } from "react";
import { createLeave, type LeaveActionState } from "@/app/actions/leave";
import { LEAVE_TYPE_LABELS, LEAVE_TYPES } from "@/app/lib/leave";

const fieldClass =
  "w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-100 [color-scheme:dark] focus:border-mint focus:outline-none";

export default function LeaveForm({
  supervisors,
}: {
  supervisors: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState<LeaveActionState, FormData>(
    createLeave,
    undefined,
  );
  const [type, setType] = useState<string>("ANNUAL");
  const isOther = type === "OTHER";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Submit this leave request?")) {
          event.preventDefault();
        }
      }}
      className="space-y-5 p-8"
    >
      {state?.errors && state.errors.length > 0 && (
        <ul role="alert" className="text-sm text-[#FCA5A5]">
          {state.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-mint">
          {state.success}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-slate-400">
          Leave type
        </label>
        <select
          name="leaveType"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={fieldClass}
        >
          {LEAVE_TYPES.map((value) => (
            <option key={value} value={value} className="text-slate-900">
              {LEAVE_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {/* Required for Other only (interview; rule 1). The server checks
          it again whatever the client does. */}
      {isOther && (
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-slate-400">
            What is the leave for?
          </label>
          <input
            type="text"
            name="otherLeaveType"
            required
            maxLength={200}
            placeholder="Please say what the leave is for"
            className={fieldClass}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-slate-400">
            Start date
          </label>
          <input type="date" name="startDate" required className={fieldClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-slate-400">
            End date
          </label>
          <input type="date" name="endDate" required className={fieldClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-slate-400">
          Supervisor (from your division)
        </label>
        <select name="supervisorId" required className={fieldClass}>
          {supervisors.map((supervisor) => (
            <option key={supervisor.id} value={supervisor.id} className="text-slate-900">
              {supervisor.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-deep disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
