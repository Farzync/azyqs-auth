"use server";

import { changePasswordSchema } from "@/lib/zod/schemas/changePassword.schema";
import {
  requireValidCSRFToken,
  getCookie,
  getUserFromToken,
  formatError,
  logError,
} from "@/lib/auth";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/auth/comparePassword";
import { hashPassword } from "@/lib/auth/hashPassword";

/**
 * Change the password of the currently authenticated user.
 *
 * @param data {unknown} - The input data (should match changePasswordSchema)
 * @returns {Object} Success object or error message with issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks current password
 * - Updates password in database
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await changePasswordAction({ currentPassword, newPassword, csrfToken });
 */
export async function changePasswordAction(data: unknown) {
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    // No audit log, userId is not available
    return {
      error: "Validation error",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const token = await getCookie("token");
  if (!token) {
    // No audit log, userId is not available
    return formatError("Unauthorized");
  }
  const user = await getUserFromToken(token);
  if (!user) {
    // No audit log, userId is not available
    return formatError("User not Found");
  }

  const { currentPassword, newPassword, csrfToken } = parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) return csrfError;

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
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
    const hashedNew = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNew },
    });

    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.CHANGE_PASSWORD,
      details: `Password changed`,
      method: AuditLogMethod.PASSWORD,
      success: true,
      at: new Date(),
    });

    return { success: true };
  } catch (error) {
    logError("changePasswordAction", error);
    try {
      if (user?.id) {
        await createUserAuditLog({
          userId: user.id,
          action: AuditLogAction.CHANGE_PASSWORD,
          details: `Password change failed`,
          method: AuditLogMethod.PASSWORD,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          at: new Date(),
        });
      }
    } catch (auditError) {
      logError("changePasswordAction.audit", auditError);
    }
    return formatError("Failed to change password");
  }
}
