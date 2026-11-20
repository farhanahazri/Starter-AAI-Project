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

  await seedLeaveRequests();
}

// Demo leave requests (Leave design rule 11, AC-27): all seven statuses,
// attached to the Reference B users and dated relative to today — only
// when the LeaveRequest table is empty, so re-running never duplicates.
// Dates are UTC midnights like the real rows (rule 2), so "N days" is
// exact everywhere.
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function seedLeaveRequests() {
  if ((await prisma.leaveRequest.count()) > 0) {
    console.log("Leave requests already present — seed skipped (no duplicates).");
    return;
  }
  const u = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`Seed user missing: ${email}`);
    return user.id;
  };
  const employee1 = await u("employee-1@budiman.com");
  const supervisor1 = await u("supervisor-1@budiman.com");
  const supervisor2 = await u("supervisor-2@budiman.com");
  const hr1 = await u("hr-1@budiman.com");
  const hr2 = await u("hr-2@budiman.com");

  const demoRequests = [
    // Supervisor 1's queue keeps one item…
    {
      employeeId: employee1, supervisorId: supervisor1,
      leaveType: "ANNUAL", startDate: daysFromNow(2), endDate: daysFromNow(4),
      status: "PENDING_SUPERVISOR",
    },
    // …and Supervisor 2's queue too.
    {
      employeeId: employee1, supervisorId: supervisor2,
      leaveType: "COMPASSIONATE", startDate: daysFromNow(1), endDate: daysFromNow(2),
      status: "PENDING_SUPERVISOR",
    },
    // Signed, waiting for the employee to send it to HR.
    {
      employeeId: employee1, supervisorId: supervisor1,
      leaveType: "UNPAID", startDate: daysFromNow(10), endDate: daysFromNow(11),
      status: "SIGNED", signedAt: daysFromNow(-1),
    },
    // In the shared HR queue.
    {
      employeeId: employee1, supervisorId: supervisor1,
      leaveType: "ANNUAL", startDate: daysFromNow(14), endDate: daysFromNow(18),
      status: "PENDING_HR", signedAt: daysFromNow(-3),
    },
    // One of each outcome, with remarks and officers, in the past.
    {
      employeeId: employee1, supervisorId: supervisor2,
      leaveType: "MATERNITY", startDate: daysFromNow(-20), endDate: daysFromNow(-6),
      status: "APPROVED", signedAt: daysFromNow(-25),
      hrOfficerId: hr1, decidedAt: daysFromNow(-22),
    },
    {
      employeeId: employee1, supervisorId: supervisor2,
      leaveType: "ANNUAL", startDate: daysFromNow(-30), endDate: daysFromNow(-28),
      status: "REJECTED_BY_SUPERVISOR",
      supervisorRemark: "Team is short-handed this month — please pick another week.",
    },
    {
      employeeId: employee1, supervisorId: supervisor1,
      leaveType: "OTHER", otherLeaveType: "volunteer teaching camp",
      startDate: daysFromNow(-12), endDate: daysFromNow(-11),
      status: "REJECTED_BY_HR", signedAt: daysFromNow(-15),
      hrOfficerId: hr2, hrRemark: "Unpaid leave is capped this quarter.",
      decidedAt: daysFromNow(-14),
    },
    // Withdrawn before the supervisor acted.
    {
      employeeId: employee1, supervisorId: supervisor2,
      leaveType: "UNPAID", startDate: daysFromNow(-5), endDate: daysFromNow(-5),
      status: "WITHDRAWN", withdrawnAt: daysFromNow(-6),
    },
  ];
  for (const r of demoRequests) {
    await prisma.leaveRequest.create({ data: r });
  }
  console.log(`Seeded ${demoRequests.length} demo leave requests (all seven statuses).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
