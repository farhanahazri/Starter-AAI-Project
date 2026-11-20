"use client";
// The user table on /admin/users (docs/specs/02-design.md §4): name, email,
// role, division, status — plus the Admin's row actions (task 10): reset
// password, deactivate/reactivate. Each action confirms first and shows a
// success message (brief rule 5.3-7); every action is re-checked on the
// server, including "not your own account" (design rule 7). The page passes
// only safe fields — passwordHash never reaches a component (rule 9).
import { useActionState } from "react";
import {
  resetPassword,
  setActive,
  type UserFormState,
} from "@/app/actions/users";
import { MIN_PASSWORD_LENGTH } from "@/app/lib/validation";

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  division: string;
  designation: string;
  active: boolean;
  lockedUntil: Date | null;
};

function statusOf(user: AdminUserRow): string {
  if (!user.active) return "Inactive";
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return "Locked";
  return "Active";
}

const buttonClass =
  "rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50";
const dangerClass =
  "rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800 hover:bg-red-100 disabled:opacity-50";

function RowMessage({ state }: { state: UserFormState }) {
  if (!state) return null;
  return (
    <>
      {(state.errors?.length ?? 0) > 0 && (
        <ul role="alert" className="mt-2 text-sm text-red-700">
          {state.errors?.map((message) => <li key={message}>{message}</li>)}
        </ul>
      )}
      {state.success && (
        <p role="status" className="mt-2 text-sm text-green-700">
          {state.success}
        </p>
      )}
    </>
  );
}

export default function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [resetState, resetAction, resetPending] = useActionState<UserFormState, FormData>(
    resetPassword,
    undefined,
  );
  const [activeState, activeAction, activePending] = useActionState<UserFormState, FormData>(
    setActive,
    undefined,
  );

  return (
    <div className="overflow-x-auto">
      <RowMessage state={resetState} />
      <RowMessage state={activeState} />
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-600">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Division</th>
            <th className="py-2 pr-4 font-medium">Designation</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-200 align-top">
              <td className="py-2 pr-4 font-medium text-gray-900">{user.name}</td>
              <td className="py-2 pr-4 text-gray-700">{user.email}</td>
              <td className="py-2 pr-4 text-gray-700">{user.role}</td>
              <td className="py-2 pr-4 text-gray-700">{user.division}</td>
              <td className="py-2 pr-4 text-gray-700">{user.designation}</td>
              <td className="py-2 pr-4 text-gray-700">{statusOf(user)}</td>
              <td className="py-2 space-x-2 whitespace-nowrap">
                <form
                  action={resetAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(`Reset the password for ${user.name}?`)
                    ) {
                      event.preventDefault();
                    }
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="password"
                    name="newPassword"
                    aria-label={`New password for ${user.name}`}
                    placeholder="New password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    className="w-32 rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                  <button type="submit" disabled={resetPending} className={buttonClass}>
                    Reset password
                  </button>
                </form>
                <form
                  action={activeAction}
                  onSubmit={(event) => {
                    const verb = user.active ? "Deactivate" : "Reactivate";
                    if (!window.confirm(`${verb} ${user.name}?`)) {
                      event.preventDefault();
                    }
                  }}
                  className="inline"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="active" value={user.active ? "false" : "true"} />
                  <button
                    type="submit"
                    disabled={activePending}
                    className={user.active ? dangerClass : buttonClass}
                  >
                    {user.active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
