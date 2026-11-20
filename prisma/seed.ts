// Demo data for the login module — docs/specs/02-design.md Reference B.
// Run with: npx prisma db seed   (config in package.json "prisma.seed")
// Idempotent: upserts by email, so re-running never duplicates.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

type DemoUser = {
  email: string;
  name: string;
  icNo: string;
  role: "EMPLOYEE" | "SUPERVISOR" | "HR" | "ADMIN";
  division: string;
  designation: string;
};

const demoUsers: DemoUser[] = [
  { email: "employee-1@budiman.com", name: "Employee 1", icNo: "00-148888", role: "EMPLOYEE", division: "Finance", designation: "Accounts Clerk" },
  { email: "supervisor-1@budiman.com", name: "Supervisor 1", icNo: "00-157777", role: "SUPERVISOR", division: "Finance", designation: "Finance Manager" },
  { email: "supervisor-2@budiman.com", name: "Supervisor 2", icNo: "00-166666", role: "SUPERVISOR", division: "Finance", designation: "Accountant" },
  { email: "hr-1@budiman.com", name: "HR 1", icNo: "00-175555", role: "HR", division: "Human Resources", designation: "HR Officer" },
  { email: "hr-2@budiman.com", name: "HR 2", icNo: "00-184444", role: "HR", division: "Human Resources", designation: "HR Officer" },
  { email: "admin@budiman.com", name: "Admin", icNo: "00-193333", role: "ADMIN", division: "Admin", designation: "Admin Manager" },
];

async function main() {
  // Hash once; every demo user shares password123, stored only as a hash.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        icNo: u.icNo,
        role: u.role,
        division: u.division,
        designation: u.designation,
      },
      create: { ...u, passwordHash, active: true, failedAttempts: 0 },
    });
  }
  console.log(`Seeded ${demoUsers.length} demo users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
