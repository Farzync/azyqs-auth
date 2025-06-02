import { prisma } from "@/lib/db";
import { AuditLogParams } from "@/types/auditlog";
import { getDeviceInfo } from "@/utils/getDeviceInfo";
import { getClientIp } from "@/utils/getClientIp";

/**
 * Creates a user audit log entry in the database.
 *
 * @param {AuditLogParams} params - The parameters for the audit log entry.
 * @param {string} params.userId - The ID of the user performing the action.
 * @param {string} params.action - The action performed by the user.
 * @param {string} [params.details] - Additional details about the action.
 * @param {string} [params.method] - The HTTP method used for the action.
 * @param {boolean} params.success - Whether the action was successful.
 * @param {string} [params.errorMessage] - Error message if the action failed.
 * @param {Date} params.at - The timestamp of when the action occurred.
 * @returns {Promise<object>} The created audit log entry.
 */
export async function createUserAuditLog(
  params: Omit<AuditLogParams, "userAgent" | "ipAddress"> & {
    userAgent?: string;
    ipAddress?: string;
  }
) {
  let userAgent = params.userAgent;
  if (!userAgent) {
    const { deviceName, deviceOS } = getDeviceInfo();
    userAgent = `${deviceName} - ${deviceOS}`;
  }

  let ipAddress = params.ipAddress;
  if (!ipAddress) {
    const ip = await getClientIp();
    ipAddress = ip === null ? "" : ip;
  }

  return prisma.userAuditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      details: params.details,
      ipAddress,
      userAgent,
      method: params.method,
      success: params.success,
      errorMessage: params.errorMessage,
      at: params.at,
    },
  });
}
