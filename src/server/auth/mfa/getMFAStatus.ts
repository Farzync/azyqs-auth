"use server";

import { prisma } from "@/lib/db";
import { formatError, getCookie, getUserFromToken, logError } from "@/lib/auth";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";

/**
 * Get the MFA (2FA) status for the authenticated user.
 *
 * @returns {Promise<Object>} Object with isEnabled boolean or error message
 *
 * Side effects:
 * - Reads user security settings from DB
 * - Logs errors on failure
 *
 * Example usage:
 * const status = await getMFAStatusAction();
 */
export async function getMFAStatusAction() {
  const token = await getCookie("access_token");
  if (!token) {
    return formatError("Not authenticated");
  }
  const payload = await getUserFromToken(token);
  if (!payload) {
    return formatError("Invalid token");
  }

  try {
    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: payload.id },
    });

    return {
      success: true,
      isEnabled: userMfaCredential?.isEnabled || false,
    };
  } catch (error) {
    logError("Get MFA status", error);
    try {
      if (payload.id) {
        await createUserAuditLog({
          userId: payload.id,
          action: AuditLogAction.GET_MFA_STATUS,
          details: `Failed to get MFA status`,
          method: AuditLogMethod.MFA,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: new Date(),
        });
      }
    } catch (auditError) {
      logError("getTOTPStatusAction.audit", auditError);
    }
    return formatError("Failed to get MFA status");
  }
}
