"use server";

import { deleteAccountSchema } from "@/lib/zod/schemas/deleteAccount.schema";
import {
  requireValidCSRFToken,
  getCookie,
  getUserFromToken,
  formatError,
  logError,
  deleteCookie,
} from "@/lib/auth";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { prisma } from "@/lib/db";
import { verifyUser } from "@/lib/auth";

/**
 * Delete the currently authenticated user's account after password and CSRF validation.
 *
 * @param data {unknown} - The input data (should match deleteAccountSchema)
 * @returns {Object} Success object or error message with issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks password
 * - Deletes user from database
 * - Deletes authentication cookie
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await deleteAccountAction({ password, csrfToken });
 */
export async function deleteAccountAction(data: unknown) {
  const parsed = deleteAccountSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Validation error",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const token = await getCookie("access_token");
  if (!token) {
    return formatError("Unauthorized");
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return formatError("User not Found");
  }

  const { password, csrfToken } = parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) {
    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.CHANGE_PASSWORD,
      details: `CSRF validation failed`,
      method: AuditLogMethod.PASSWORD,
      success: false,
      errorMessage: csrfError.error,
      at: new Date(),
    });
    return formatError("CSRF validation failed");
  }

  const verifyResult = await verifyUser(user.username, password);
  if (!verifyResult.success) {
    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.CHANGE_PASSWORD,
      details: `Current password is incorrect`,
      method: AuditLogMethod.PASSWORD,
      success: false,
      errorMessage: "Current password is incorrect",
      at: new Date(),
    });
    return formatError("Current password is incorrect");
  }

  try {
    await prisma.user.delete({ where: { id: user.id } });
    await deleteCookie("access_token");

    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.DELETE_ACCOUNT,
      details: `Account deleted`,
      method: AuditLogMethod.PASSWORD,
      success: true,
      at: new Date(),
    });

    return { success: true };
  } catch (error) {
    logError("deleteAccountAction", error);
    try {
      if (user?.id) {
        await createUserAuditLog({
          userId: user.id,
          action: AuditLogAction.DELETE_ACCOUNT,
          details: `Account delete failed`,
          method: AuditLogMethod.PASSWORD,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          at: new Date(),
        });
      }
    } catch (auditError) {
      logError("deleteAccountAction.audit", auditError);
    }
    return formatError("Failed to delete account");
  }
}
