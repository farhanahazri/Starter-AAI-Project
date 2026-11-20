// One PrismaClient for the whole server. The globalThis guard stops
// `next dev` hot-reload from opening a new connection every save.
import { PrismaClient } from "@prisma/client";

const g = globalThis as { prisma?: PrismaClient };

export const prisma: PrismaClient = g.prisma ?? new PrismaClient();
if (!g.prisma) g.prisma = prisma;
