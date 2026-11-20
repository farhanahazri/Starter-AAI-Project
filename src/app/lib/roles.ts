// The one place that knows the four roles and where each one lives
// (docs/specs/02-design.md §4). Login redirects, requireRole and the
// user-management form all read from here.

export const ROLES = ["EMPLOYEE", "SUPERVISOR", "HR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

const HOME_BY_ROLE: Record<Role, string> = {
  EMPLOYEE: "/employee",
  SUPERVISOR: "/supervisor",
  HR: "/hr",
  ADMIN: "/admin",
};

/** Home route for a role; unknown roles go back to /login, nowhere else. */
export function homeOf(role: string): string {
  return HOME_BY_ROLE[role as Role] ?? "/login";
}
