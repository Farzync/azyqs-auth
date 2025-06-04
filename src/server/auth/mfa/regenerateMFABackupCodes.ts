"use server";

import { prisma } from "@/lib/db";
import { formatError, getCookie, logError, verifyToken } from "@/lib/auth";
import { TokenPayload } from "@/types/token";
import { generateBackupCodes, hashBackupCodes } from "@/lib/auth/backupCodes";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";

/**
 * Regenerate backup codes for the authenticated user (MFA must be enabled).
 *
 * @returns {Promise<Object>} Object with new backup codes or error message
 *
 * Side effects:
 * - Generates and hashes new backup codes
 * - Updates backup codes in DB
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await regenerateBackupCodesAction();
 */
export async function regenerateBackupCodesAction() {
  const token = await getCookie("token");
  if (!token) {
    return formatError("Not authenticated");
  }
  const payload = await verifyToken<TokenPayload>(token);
  if (!payload) {
    return formatError("Invalid token");
  }
  const timestamp = new Date();
  try {
    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: payload.id },
    });
    if (!userMfaCredential || !userMfaCredential.isEnabled) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.REGENERATE_BACKUP_CODE,
        details: `Attempted to regenerate backup codes but MFA is not enabled`,
        method: AuditLogMethod.MFA_BACKUP,
        success: false,
        errorMessage: "MFA must be enabled to regenerate backup codes",
        at: timestamp,
      });
      return formatError("MFA must be enabled to regenerate backup codes");
    }
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);
    await prisma.userMfaCredential.update({
      where: { userId: payload.id },
      data: { backupCodes: hashedBackupCodes },
    });
    await createUserAuditLog({
      userId: payload.id,
      action: AuditLogAction.REGENERATE_BACKUP_CODE,
      details: `Backup codes regenerated successfully`,
      method: AuditLogMethod.MFA_BACKUP,
      success: true,
      at: timestamp,
    });
    return { success: true, backupCodes };
  } catch (error) {
    logError("Regenerate Backup Codes", error);
    try {
      if (payload.id) {
        await createUserAuditLog({
          userId: payload.id,
          action: AuditLogAction.REGENERATE_BACKUP_CODE,
          details: `Failed to regenerate backup codes`,
          method: AuditLogMethod.MFA_BACKUP,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      }
    } catch (auditError) {
      logError("regenerateBackupCodesAction.audit", auditError);
    }
    return formatError("Failed to regenerate backup codes");
  }
}
