// Shared field checks for the Admin user form (docs/specs/02-design.md
// rule 7 + Reference A). Pure module: the client form imports the lists for
// its selects, and the server action runs validateUserInput before any
// write (design §5 — checks here, uniqueness against the DB in the action).
import { isRole } from "./roles";

export const DIVISION_DESIGNATIONS: Record<string, string[]> = {
  Finance: ["Finance Manager", "Accountant", "Accounts Clerk"],
  "Human Resources": ["HR Manager", "HR Officer", "HR Assistant"],
  "Information Technology": [
    "IT Manager",
    "Software Developer",
    "IT Support Officer",
  ],
  Operations: [
    "Operations Manager",
    "Operations Supervisor",
    "Operations Executive",
  ],
  Marketing: [
    "Marketing Manager",
    "Marketing Executive",
    "Marketing Assistant",
  ],
};

export const DIVISIONS = Object.keys(DIVISION_DESIGNATIONS);
export const MIN_PASSWORD_LENGTH = 8;

// xx-xxxxxx: 2 digits, hyphen, 6 digits (brief §7.2).
const IC_PATTERN = /^\d{2}-\d{6}$/;

export type UserFormValues = {
  name: string;
  icNo: string;
  email: string;
  role: string;
  division: string;
  designation: string;
  password: string;
};

export function readUserForm(formData: FormData): UserFormValues {
  return {
    name: String(formData.get("name") ?? "").trim(),
    icNo: String(formData.get("icNo") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: String(formData.get("role") ?? ""),
    division: String(formData.get("division") ?? ""),
    designation: String(formData.get("designation") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

/** Field errors in plain words (AC-11); empty array means the input is good. */
export function validateUserInput(v: UserFormValues): string[] {
  const errors: string[] = [];
  const name = v.name.trim();
  if (!name) errors.push("Name is required.");
  if (!/^[^@\s]+@budiman\.com$/.test(v.email)) {
    errors.push("Email must be a valid @budiman.com address.");
  }
  if (!IC_PATTERN.test(v.icNo)) {
    errors.push("IC number must match the format 00-123456.");
  }
  if (!isRole(v.role)) {
    errors.push("Role must be Employee, Supervisor, HR or Admin.");
  }
  if (!DIVISION_DESIGNATIONS[v.division]) {
    errors.push("Division must be one of the listed divisions.");
  } else if (!DIVISION_DESIGNATIONS[v.division].includes(v.designation)) {
    errors.push(`Designation "${v.designation}" does not belong to ${v.division}.`);
  }
  if (v.password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return errors;
}
