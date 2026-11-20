import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import DemoAccountsBox from "@/components/DemoAccountsBox";
import { isSafeNext } from "@/app/lib/safe-next";

export const metadata: Metadata = { title: "Log in – Budiman HRMS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // AC-05: /login?next=/hr offers that page back after signing in. Anything
  // that is not a plain internal path never reaches the form at all; the
  // login action checks the same rule again before redirecting (rule 5).
  const { next } = await searchParams;
  const safeNext = typeof next === "string" && isSafeNext(next) ? next : undefined;
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <h1 className="text-center text-2xl font-semibold text-gray-900">
        Budiman HRMS
      </h1>
      <p className="mt-1 text-center text-sm text-gray-600">
        Leave Request module — log in with your work email.
      </p>
      <LoginForm next={safeNext} />
      <DemoAccountsBox />
    </main>
  );
}
