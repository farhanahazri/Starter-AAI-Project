import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";

export const metadata: Metadata = { title: "Admin – Budiman HRMS" };

// Admin home (leave design §4): keeps the user-management link from the
// login section and gains the "All leave records" link (leave task 9).
// Card look per §4 "Look and feel": translucent navy card, mint title band.
export default async function AdminHome() {
  await requireRole("ADMIN", "/admin");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h1 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          Admin home
        </h1>
        <p className="p-8 text-sm leading-6 text-slate-300">
          User management lives at{" "}
          <a className="text-mint underline hover:text-white" href="/admin/users">
            /admin/users
          </a>{" "}
          and every leave record (view only) at{" "}
          <a
            className="text-mint underline hover:text-white"
            href="/admin/leave"
          >
            /admin/leave
          </a>
          .
        </p>
      </section>
    </main>
  );
}
