"use server";

import { prisma } from "@/lib/db";
import { mfaSetupSchema } from "@/lib/zod/schemas/mfa.schema";
import { z } from "zod";
import { TokenPayload } from "@/types/token";
import { formatError, getCookie, verifyToken, logError } from "@/lib/auth";
import {
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/auth/mfaBackupCodes";
import { validateCSRFToken } from "@/server/utils/csrfToken";
import { verifyMFACode } from "@/lib/auth/mfa";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";

/**
 * Enable MFA (2FA) for the authenticated user after verifying code and CSRF.
 *
 * @param input {z.infer<typeof mfaSetupSchema>} - The input object with MFA code and CSRF token
 * @returns {Promise<Object>} Success object or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Verifies MFA code
 * - Enables MFA and generates backup codes
 * - Updates user security settings in DB
 * - Creates audit log entry for MFA enablement
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await enableTOTPAction({ code, csrfToken });
 */
export async function enableMFAAction(input: z.infer<typeof mfaSetupSchema>) {
  const parsed = mfaSetupSchema.safeParse(input);
  const timestamp = new Date();

  if (!parsed.success) {
    return formatError("Validation error", parsed.error.flatten().fieldErrors);
  }

  const { code, csrfToken } = parsed.data;

  const isCSRFValid = await validateCSRFToken(csrfToken);
  if (!isCSRFValid) {
    return formatError(
      "Invalid CSRF token. Please refresh the page and try again."
    );
  }

  const token = await getCookie("token");
  if (!token) {
    return formatError("Not authenticated");
  }
  const payload = await verifyToken<TokenPayload>(token);
  if (!payload) {
    return formatError("Invalid token");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { username: true },
    });

    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: payload.id },
    });

    if (!userMfaCredential) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.ENABLE_MFA,
        details: `Failed to enable MFA for username: ${user?.username} - MFA not setup`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "MFA not setup",
        at: timestamp,
      });

      return formatError("MFA not setup");
    }

    const isValid = verifyMFACode(code, userMfaCredential.secret);
    if (!isValid) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.ENABLE_MFA,
        details: `Failed to enable MFA for username: ${user?.username} - invalid MFA code`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Invalid MFA code",
        at: timestamp,
      });

      return formatError("Invalid MFA code");
    }

    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    await prisma.userMfaCredential.update({
      where: { userId: payload.id },
      data: { isEnabled: true, backupCodes: hashedBackupCodes },
    });

    await createUserAuditLog({
      userId: payload.id,
      action: AuditLogAction.ENABLE_MFA,
      details: `MFA successfully enabled for username: ${user?.username}`,
      method: AuditLogMethod.MFA,
      success: true,
      at: timestamp,
    });

    return { success: true, backupCodes };
  } catch (error) {
    logError("Enable MFA", error);

    try {
      if (payload.id) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { username: true },
        });

        await createUserAuditLog({
          userId: payload.id,
          action: AuditLogAction.ENABLE_MFA,
          details: `Failed to enable MFA for username: ${user?.username} - system error`,
          method: AuditLogMethod.MFA,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      }
    } catch (auditError) {
      logError("enableTOTPAction - audit log creation failed", auditError);
    }

    return formatError("Failed to enable MFA");
  }
}
