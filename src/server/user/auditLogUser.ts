"use server";

import { prisma } from "@/lib/db";
import { getCookie } from "@/lib/auth/cookies";
import { getUserFromToken } from "@/lib/auth";

/**
 * Get audit logs for the currently logged-in user (from token cookie)
 * Supports cursor-based pagination using the `at` and `id` fields.
 * @param limit {number} - Max number of logs to fetch (default 20)
 * @param cursor {object} - { at: Date, id: string } of the last log from previous page
 * @returns { logs, nextCursor }
 */
export async function getCurrentUserAuditLogs(
  limit = 20,
  cursor?: { at: Date; id: string }
) {
  const token = await getCookie("access_token");
  if (!token) return { logs: [], nextCursor: null };
  const user = await getUserFromToken(token);
  if (!user) return { logs: [], nextCursor: null };

  const where = { userId: user.id };
  let logs;
  if (cursor) {
    logs = await prisma.userAuditLog.findMany({
      where: {
        ...where,
        OR: [
          { at: { lt: cursor.at } },
          { at: cursor.at, id: { lt: cursor.id } },
        ],
      },
      orderBy: [{ at: "desc" }, { id: "desc" }],
      take: limit,
    });
  } else {
    logs = await prisma.userAuditLog.findMany({
      where,
      orderBy: [{ at: "desc" }, { id: "desc" }],
      take: limit,
    });
  }

  let nextCursor = null;
  if (logs.length === limit) {
    const last = logs[logs.length - 1];
    nextCursor = { at: last.at, id: last.id };
  }
  return { logs, nextCursor };
}
