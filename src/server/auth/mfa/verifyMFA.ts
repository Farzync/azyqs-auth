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
import { validateCSRFToken } from "@/server/utils/csrfToken";
import { verifyMFACode } from "@/lib/auth/mfa";
import { prisma } from "@/lib/db";
import { mfaVerifySchema } from "@/lib/zod/schemas/mfa.schema";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";
import { getClientIp } from "@/utils/getClientIp";

/**
 * Verify an MFA code for 2FA login and issue a session token if valid.
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
 * - Applies rate limiting: blocks after 5 failed attempts in 5 minutes per user and IP
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

  let clientIp = "";
  try {
    clientIp = (await getClientIp()) || "";
  } catch {}
  if (tempUserId && clientIp) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const failedAttempts = await prisma.userAuditLog.count({
      where: {
        userId: tempUserId,
        ipAddress: clientIp,
        action: AuditLogAction.LOGIN,
        method: AuditLogMethod.MFA,
        success: false,
        at: { gte: fiveMinutesAgo },
      },
    });
    if (failedAttempts >= 5) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Blocked MFA verification due to too many failed attempts from IP ${clientIp}`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Too many failed MFA attempts",
        at: new Date(),
        ipAddress: clientIp,
      });
      return formatError(
        "Terlalu banyak percobaan verifikasi MFA gagal. Silakan coba lagi nanti."
      );
    }
  }

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
        details: `MFA validation error`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "Validation error",
        at: timestamp,
        ipAddress: clientIp,
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
        ipAddress: clientIp,
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
        details: `Failed MFA verification for username: ${user?.username}`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "MFA not enabled",
        at: timestamp,
        ipAddress: clientIp,
      });
      return formatError("MFA not enabled");
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
        ipAddress: clientIp,
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
      ipAddress: clientIp,
    });

    return { success: true };
  } catch (error) {
    logError("Verify MFA", error);
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
          ipAddress: clientIp,
        });
      }
    } catch (auditError) {
      logError("verifyTOTPAction - audit log creation failed", auditError);
    }
    return formatError("Failed to verify MFA");
  }
}
