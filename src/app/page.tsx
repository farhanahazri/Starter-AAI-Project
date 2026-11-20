import { redirect } from "next/navigation";
import { requireUser } from "@/app/lib/dal";
import { homeOf } from "@/app/lib/roles";

// The placeholder home page, replaced per docs/specs/02-design.md rule 4:
// signed in → your role's home; not signed in → /login. The guard is the
// single door used by every protected page (task 7).
export default async function Home() {
  const user = await requireUser();
  redirect(homeOf(user.role));
}
