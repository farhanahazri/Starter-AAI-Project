import type { Metadata } from "next";
import "./globals.css";
import { verifySession } from "@/app/lib/dal";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Budiman HRMS",
  description: "Leave Request module for Budiman Company.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Decoration only — this header shows the name when there is a session.
  // It is NOT the security check; pages and actions call requireUser/
  // requireRole themselves (docs/specs/02-design.md rule 4).
  const user = await verifySession();
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {user && <Header name={user.name} />}
        {children}
      </body>
    </html>
  );
}
