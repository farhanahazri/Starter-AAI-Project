import type { Metadata } from "next";
import { requireRole } from "@/app/lib/dal";

export const metadata: Metadata = { title: "HR – Budiman HRMS" };

// Placeholder until the leave-request spec (docs/specs/02-design.md §4).
// Card look per §4 "Look and feel": translucent navy card, mint title band.
export default async function HrHome() {
  await requireRole("HR", "/hr");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="overflow-hidden rounded-2xl border border-mint/25 bg-night/90 shadow-2xl shadow-black/40">
        <h1 className="bg-mint py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-night-deep">
          HR home
        </h1>
        <p className="p-8 text-sm leading-6 text-slate-300">
          The HR decision queue will appear here.
        </p>
      </section>
    </main>
  );
}
