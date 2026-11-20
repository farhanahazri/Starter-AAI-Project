"use server";
// Admin user management (docs/specs/02-design.md rule 7). Every action
// re-checks ADMIN on the server itself — page guards are decoration only
// (OWASP / design rule 4). Passwords are hashed here and never read back.
// (Next 16: "use server" files may only export async functions, so the
// state type below is a type-only export and the messages live in lib.)
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { requireRole } from "@/app/lib/dal";
import {
  readUserForm,
  validateUserInput,
  MIN_PASSWORD_LENGTH,
} from "@/app/lib/validation";

export type UserFormState =
  | { errors?: string[]; success?: string }
  | undefined;

export async function addUser(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole("ADMIN"); // AC-06/AC-11: checked again on the server
  const values = readUserForm(formData);
  const errors = validateUserInput(values);
  if (errors.length) return { errors };

  if (await prisma.user.findUnique({ where: { email: values.email } })) {
    return { errors: ["That email is already registered."] };
  }
  if (await prisma.user.findUnique({ where: { icNo: values.icNo } })) {
    return { errors: ["That IC number is already registered."] };
  }

  await prisma.user.create({
    data: {
      name: values.name,
      icNo: values.icNo,
      email: values.email,
      passwordHash: await bcrypt.hash(values.password, 10),
      role: values.role,
      division: values.division,
      designation: values.designation,
    },
  });
  revalidatePath("/admin/users"); // so the fresh row appears without a manual reload
  return { success: `${values.name} added — they can log in now.` };
}

function readUserId(formData: FormData): number {
  return Number(formData.get("userId"));
}

/** Admin sets a fresh password for someone else (U10/AC-12, design rule 7).
 * Writes a new bcrypt hash and clears the failed-attempt fields. */
export async function resetPassword(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireRole("ADMIN"); // checked on the server, again
  const id = readUserId(formData);
  const password = String(formData.get("newPassword") ?? "");

  if (id === admin.id) {
    return { errors: ["You cannot reset your own password from this page."] };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      errors: [`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`],
    };
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { errors: ["That user no longer exists."] };

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      failedAttempts: 0,
      lockedUntil: null, // rule 7: a reset also clears the lockout fields
    },
  });
  revalidatePath("/admin/users");
  return { success: `New password set for ${target.name}.` };
}

/** Deactivate / reactivate — rows are never deleted (design rule 7). */
export async function setActive(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireRole("ADMIN");
  const id = readUserId(formData);
  const active = formData.get("active") === "true";

  if (id === admin.id) {
    return {
      errors: ["You cannot deactivate or reactivate your own account."],
    };
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { errors: ["That user no longer exists."] };

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/admin/users");
  return {
    success: `${target.name} ${active ? "reactivated" : "deactivated"}.`,
  };
}
