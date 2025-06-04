"use server";

import {
  getCookie,
  formatError,
  signToken,
  setCookie,
  deleteCookie,
  logError,
  verifyToken,
} from "@/lib/auth";
import { validateCSRFToken } from "@/lib/auth/csrfToken";
import { verifyMFACode } from "@/lib/auth/mfa";
import { prisma } from "@/lib/db";
import { mfaVerifySchema } from "@/lib/zod/schemas/mfa.schema";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";

/**
 * Verify a MFA code for 2FA login and issue a session token if valid.
 *
 * @param input {Object} - The input object containing MFA code and CSRF token
 * @param input.code {string} - The MFA code entered by the user
 * @param input.csrfToken {string} - The CSRF token for validation
 * @returns {Promise<Object>} Success object with session or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks MFA code against stored secret
 * - Issues JWT and sets cookie if valid
 * - Creates audit log entry for MFA verification
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await verifyTOTPAction({ code, csrfToken });
 */
export async function verifyMFAAction(input: {
  code: string;
  csrfToken: string;
}) {
  const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
  const tempUserId = await getCookie("temp_user_id");
  const timestamp = new Date();

  let auditUserId = tempUserId;
  if (!tempUserId) {
    const token = await getCookie("token");
    let payloadId: string | undefined = undefined;
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload && typeof payload === "object" && "id" in payload) {
          payloadId = payload.id as string;
        }
      } catch {}
    }
    auditUserId = payloadId;
    if (auditUserId) {
      await createUserAuditLog({
        userId: auditUserId,
        action: AuditLogAction.LOGIN,
        details: `Attempted MFA login but session expired`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Session expired",
        at: timestamp,
      });
    }
    return formatError("Session expired, please login again");
  }

  try {
    const parsed = mfaVerifySchema.safeParse(input);
    if (!parsed.success) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `TOTP validation error`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Validation error",
        at: timestamp,
      });
      return formatError(
        "Validation error",
        parsed.error.flatten().fieldErrors
      );
    }

    const { code, csrfToken } = parsed.data;

    const isCSRFValid = await validateCSRFToken(csrfToken);
    if (!isCSRFValid) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Invalid CSRF token during MFA login`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Invalid CSRF token",
        at: timestamp,
      });
      return formatError(
        "Invalid CSRF token. Please refresh the page and try again."
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tempUserId },
      select: { username: true },
    });

    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: tempUserId },
    });

    if (!userMfaCredential || !userMfaCredential.isEnabled) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Failed MFA verification for username: ${user?.username} - MFA not enabled`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "TOTP not enabled",
        at: timestamp,
      });

      return formatError("TOTP not enabled");
    }

    const isValid = verifyMFACode(code, userMfaCredential.secret);
    if (!isValid) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Failed login for username: ${user?.username} - incorrect MFA code`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Invalid MFA code",
        at: timestamp,
      });

      return formatError("Invalid MFA code");
    }

    const token = await signToken({ id: tempUserId });
    await setCookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge,
      path: "/",
    });
    await deleteCookie("temp_user_id");

    await createUserAuditLog({
      userId: tempUserId,
      action: AuditLogAction.LOGIN,
      details: `Successful MFA verification and login completed for username: ${user?.username}`,
      method: AuditLogMethod.MFA,
      success: true,
      at: timestamp,
    });

    return { success: true };
  } catch (error) {
    logError("Verify TOTP", error);

    try {
      if (tempUserId) {
        const user = await prisma.user.findUnique({
          where: { id: tempUserId },
          select: { username: true },
        });

        await createUserAuditLog({
          userId: tempUserId,
          action: AuditLogAction.LOGIN,
          details: `Failed MFA verification for username: ${user?.username}`,
          method: AuditLogMethod.MFA,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      }
    } catch (auditError) {
      logError("verifyTOTPAction - audit log creation failed", auditError);
    }

    return formatError("Failed to verify TOTP");
  }
}
