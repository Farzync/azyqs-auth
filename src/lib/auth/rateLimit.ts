import { prisma } from "@/lib/db";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";

/**
 * Checks if the number of failed attempts for a given user, IP, action, and method
 * exceeds the allowed maximum within a time window.
 *
 * @param userId - User ID (string)
 * @param ip - IP address (string)
 * @param action - AuditLogAction (enum or string)
 * @param method - AuditLogMethod (enum or string, optional)
 * @param windowMs - Time window in milliseconds
 * @param maxAttempts - Maximum allowed failed attempts
 * @returns {Promise<boolean>} - true if rate limit exceeded, false otherwise
 */
export async function checkRateLimit(
  userId: string,
  ip: string,
  action: AuditLogAction,
  method: AuditLogMethod | undefined,
  windowMs: number,
  maxAttempts: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const where: {
    userId: string;
    ipAddress: string;
    action: AuditLogAction;
    success: false;
    at: { gte: Date };
    method?: AuditLogMethod;
  } = {
    userId,
    ipAddress: ip,
    action,
    success: false,
    at: { gte: since },
  };
  if (method) {
    where.method = method;
  }
  const failedAttempts = await prisma.userAuditLog.count({ where });
  return failedAttempts >= maxAttempts;
}
