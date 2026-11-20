"use client";
// "Add a user" on /admin/users (docs/specs/01-requirements.md U10, AC-10/11).
// Brief rule 5.3-7: the action asks for confirmation first, then the page
// shows a success message. The server action validates everything again —
// these HTML attributes are only a first line of defence.
import { useActionState, useState } from "react";
import { addUser, type UserFormState } from "@/app/actions/users";
import { ROLES } from "@/app/lib/roles";
import { DIVISIONS, DIVISION_DESIGNATIONS, MIN_PASSWORD_LENGTH } from "@/app/lib/validation";

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  SUPERVISOR: "Supervisor",
  HR: "HR",
  ADMIN: "Admin",
};

const inputClass =
  "mt-1 w-full rounded border border-gray-300 px-3 py-2";
const labelClass = "block text-sm font-medium text-gray-700";

export default function AddUserForm() {
  const [state, formAction, isPending] = useActionState<UserFormState, FormData>(
    addUser,
    undefined,
  );
  const [division, setDivision] = useState<string>(DIVISIONS[0]);
  const designations = DIVISION_DESIGNATIONS[division] ?? [];

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Brief rule 5.3-7: confirm before changing data.
        if (!window.confirm("Add this user?")) event.preventDefault();
      }}
      className="mt-8 grid grid-cols-1 gap-4 rounded-lg border border-gray-300 bg-white p-6 shadow sm:grid-cols-2"
    >
      <div>
        <label htmlFor="name" className={labelClass}>Full name</label>
        <input id="name" name="name" required placeholder="Tester 1" className={inputClass} />
      </div>
      <div>
        <label htmlFor="icNo" className={labelClass}>IC number</label>
        <input
          id="icNo"
          name="icNo"
          required
          pattern="\d{2}-\d{6}"
          placeholder="00-111111"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="tester-1@budiman.com"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="role" className={labelClass}>Role</label>
        <select id="role" name="role" required className={inputClass} defaultValue="EMPLOYEE">
          {ROLES.map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="division" className={labelClass}>Division</label>
        <select
          id="division"
          name="division"
          required
          className={inputClass}
          value={division}
          onChange={(event) => setDivision(event.target.value)}
        >
          {DIVISIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="designation" className={labelClass}>Designation</label>
        <select id="designation" name="designation" required className={inputClass} key={division}>
          {designations.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div className="sm:self-end">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add user"}
        </button>
      </div>
      {(state?.errors?.length ?? 0) > 0 && (
        <ul role="alert" className="text-sm text-red-700 sm:col-span-2">
          {state?.errors?.map((message) => <li key={message}>{message}</li>)}
        </ul>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-green-700 sm:col-span-2">
          {state.success}
        </p>
      )}
    </form>
  );
}
