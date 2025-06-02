"use server";

import { prisma } from "@/lib/db";
import { totpSetupSchema } from "@/lib/zod/schemas/totp.schema";
import { z } from "zod";
import { TokenPayload } from "@/types/token";
import { formatError, getCookie, verifyToken, logError } from "@/lib/auth";
import { generateBackupCodes, hashBackupCodes } from "@/lib/auth/backupCodes";
import { validateCSRFToken } from "@/lib/auth/csrfToken";
import { verifyTOTPCode } from "@/lib/auth/totp";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";

/**
 * Enable TOTP (2FA) for the authenticated user after verifying code and CSRF.
 *
 * @param input {z.infer<typeof totpSetupSchema>} - The input object with TOTP code and CSRF token
 * @returns {Promise<Object>} Success object or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Verifies TOTP code
 * - Enables TOTP and generates backup codes
 * - Updates user security settings in DB
 * - Creates audit log entry for MFA enablement
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await enableTOTPAction({ code, csrfToken });
 */
export async function enableTOTPAction(input: z.infer<typeof totpSetupSchema>) {
  const parsed = totpSetupSchema.safeParse(input);
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
        details: `Failed to enable MFA for username: ${user?.username} - TOTP not setup`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "TOTP not setup",
        at: timestamp,
      });

      return formatError("TOTP not setup");
    }

    const isValid = verifyTOTPCode(code, userMfaCredential.secret);
    if (!isValid) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.ENABLE_MFA,
        details: `Failed to enable MFA for username: ${user?.username} - invalid TOTP code`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Invalid TOTP code",
        at: timestamp,
      });

      return formatError("Invalid TOTP code");
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
    logError("Enable TOTP", error);

    try {
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
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        at: timestamp,
      });
    } catch (auditError) {
      logError("enableTOTPAction - audit log creation failed", auditError);
    }

    return formatError("Failed to enable TOTP");
  }
}
