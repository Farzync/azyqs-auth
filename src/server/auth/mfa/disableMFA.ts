"use server";

import { prisma } from "@/lib/db";
import { mfaDisableSchema } from "@/lib/zod/schemas/mfa.schema";
import { z } from "zod";
import { TokenPayload } from "@/types/token";
import { formatError, verifyToken, logError, getCookie } from "@/lib/auth";
import { validateCSRFToken } from "@/server/utils/csrfToken";
import { verifyUser } from "@/lib/auth";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";

/**
 * Disable MFA (2FA) for the authenticated user after password and CSRF validation.
 *
 * @param input {z.infer<typeof mfaDisableSchema>} - The input object with password and CSRF token
 * @returns {Promise<Object>} Success object or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks password
 * - Disables MFA in DB
 * - Creates audit log entry for MFA disablement
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await disableTOTPAction({ password, csrfToken });
 */
export async function disableMFAAction(
  input: z.infer<typeof mfaDisableSchema>
) {
  const parsed = mfaDisableSchema.safeParse(input);
  const timestamp = new Date();

  if (!parsed.success) {
    return formatError("Validation error", parsed.error.flatten().fieldErrors);
  }

  const { password, csrfToken } = parsed.data;

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
    });

    if (!user) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.DISABLE_MFA,
        details: `Failed to disable MFA - user not found`,
        method: AuditLogMethod.PASSWORD,
        success: false,
        errorMessage: "User not found",
        at: timestamp,
      });

      return formatError("User not found");
    }

    const verifyResult = await verifyUser(user.username, password);
    if (!verifyResult.success) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.DISABLE_MFA,
        details: `Failed to disable MFA for username: ${user.username} - incorrect password`,
        method: AuditLogMethod.PASSWORD,
        success: false,
        errorMessage: "Incorrect password",
        at: timestamp,
      });

      return formatError("Incorrect password");
    }

    await prisma.userMfaCredential.update({
      where: { userId: payload.id },
      data: { isEnabled: false },
    });

    await createUserAuditLog({
      userId: payload.id,
      action: AuditLogAction.DISABLE_MFA,
      details: `MFA successfully disabled for username: ${user.username}`,
      method: AuditLogMethod.PASSWORD,
      success: true,
      at: timestamp,
    });

    return { success: true };
  } catch (error) {
    logError("Disable MFA", error);

    try {
      if (payload.id) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { username: true },
        });

        await createUserAuditLog({
          userId: payload.id,
          action: AuditLogAction.DISABLE_MFA,
          details: `Failed to disable MFA for username: ${user?.username} - system error`,
          method: AuditLogMethod.PASSWORD,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      }
    } catch (auditError) {
      logError("disableTOTPAction - audit log creation failed", auditError);
    }

    return formatError("Failed to disable MFA");
  }
}
