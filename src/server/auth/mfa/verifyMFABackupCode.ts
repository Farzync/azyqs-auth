"use server";

import {
  getCookie,
  formatError,
  signToken,
  setCookie,
  deleteCookie,
  logError,
} from "@/lib/auth";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { verifyBackupCode } from "@/lib/auth/mfaBackupCodes";
import { validateCSRFToken } from "@/server/utils/csrfToken";
import { prisma } from "@/lib/db";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { TokenPayload } from "@/types/token";
import { mfaBackupCodeVerifySchema } from "@/lib/zod/schemas/mfa.schema";
import { getClientIp } from "@/utils/getClientIp";
import { checkRateLimit } from "@/lib/auth/rateLimit";

/**
 * Verify an MFA backup code for 2FA login and issue a session token if valid.
 *
 * @param input {Object} - The input object containing backup code and CSRF token
 * @param input.code {string} - The backup code entered by the user
 * @param input.csrfToken {string} - The CSRF token for validation
 * @returns {Promise<Object>} Success object with session or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks backup code against stored hashes
 * - Issues JWT and sets cookie if valid
 * - Deletes used backup code
 * - Logs errors on failure
 * - Applies rate limiting: blocks after 5 failed attempts in 5 minutes per user and IP
 *
 * Example usage:
 * const result = await verifyTOTPBackupAction({ code, csrfToken });
 */
export async function verifyMFABackupAction(input: {
  code: string;
  csrfToken: string;
}) {
  const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
  const refreshMaxAge = parseJwtPeriodToSeconds(process.env.JWT_REFRESH_PERIOD || "1d");
  const tempUserId = await getCookie("temp_user_id");
  let auditUserId = tempUserId;
  if (!tempUserId) {
    const token = await getCookie("access_token");
    let payloadId: string | undefined = undefined;
    if (token) {
      try {
        const { id } = (await (
          await import("@/lib/auth")
        ).verifyToken(token)) as TokenPayload;
        payloadId = id;
      } catch {}
    }
    auditUserId = payloadId;
    if (auditUserId) {
      await createUserAuditLog({
        userId: auditUserId,
        action: AuditLogAction.LOGIN,
        details: `Attempted backup code login but session expired`,
        method: AuditLogMethod.MFA_BACKUP,
        success: false,
        errorMessage: "Session expired",
        at: new Date(),
      });
    }
    return formatError("Session expired, please login again");
  }

  const timestamp = new Date();

  let clientIp = "";
  try {
    clientIp = (await getClientIp()) || "";
  } catch {}
  if (tempUserId && clientIp) {
    const isRateLimited = await checkRateLimit(
      tempUserId,
      clientIp,
      AuditLogAction.LOGIN,
      AuditLogMethod.MFA_BACKUP,
      5 * 60 * 1000,
      5
    );
    if (isRateLimited) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Blocked backup code verification due to too many failed attempts from IP ${clientIp}`,
        method: AuditLogMethod.MFA_BACKUP,
        success: false,
        errorMessage: "Too many failed backup code attempts",
        at: new Date(),
        ipAddress: clientIp,
      });
      return formatError(
        "Terlalu banyak percobaan verifikasi backup code gagal. Silakan coba lagi nanti."
      );
    }
  }

  try {
    const parsed = mfaBackupCodeVerifySchema.safeParse(input);
    if (!parsed.success) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Backup code validation error`,
        method: AuditLogMethod.MFA_BACKUP,
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
        details: `Invalid CSRF token during backup code login`,
        method: AuditLogMethod.MFA_BACKUP,
        success: false,
        errorMessage: "Invalid CSRF token",
        at: timestamp,
        ipAddress: clientIp,
      });
      return formatError(
        "Invalid CSRF token. Please refresh the page and try again."
      );
    }

    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: tempUserId },
    });

    if (!userMfaCredential || !userMfaCredential.isEnabled) {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Attempted backup code login but MFA not enabled`,
        method: AuditLogMethod.MFA_BACKUP,
        success: false,
        errorMessage: "MFA not enabled",
        at: timestamp,
        ipAddress: clientIp,
      });
      return formatError("MFA not enabled");
    }

    const idx = await verifyBackupCode(
      code,
      userMfaCredential.backupCodes || []
    );

    if (idx !== null && idx >= 0) {
      const newBackupCodes = [...userMfaCredential.backupCodes];
      newBackupCodes.splice(idx, 1);

      await prisma.userMfaCredential.update({
        where: { userId: tempUserId },
        data: { backupCodes: newBackupCodes },
      });
      const token = await signToken({ id: tempUserId });
      const refreshToken = await signToken({ id: tempUserId });
      await setCookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge,
        path: "/",
      });
      await setCookie("refresh_token", refreshToken, {
        maxAge: refreshMaxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      await deleteCookie("temp_user_id");
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Successful login using backup code`,
        method: AuditLogMethod.MFA_BACKUP,
        success: true,
        at: timestamp,
        ipAddress: clientIp,
      });
      return { success: true };
    } else {
      await createUserAuditLog({
        userId: tempUserId,
        action: AuditLogAction.LOGIN,
        details: `Failed login using backup code`,
        method: AuditLogMethod.MFA_BACKUP,
        success: false,
        errorMessage: "Invalid backup code",
        at: timestamp,
        ipAddress: clientIp,
      });
      return formatError("Invalid backup code");
    }
  } catch (error) {
    logError("Verify Backup Code", error);
    try {
      if (tempUserId) {
        await createUserAuditLog({
          userId: tempUserId,
          action: AuditLogAction.LOGIN,
          details: `Failed login using backup code`,
          method: AuditLogMethod.MFA_BACKUP,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
          ipAddress: clientIp,
        });
      }
    } catch (auditError) {
      logError("verifyTOTPBackupAction.audit", auditError);
    }
    return formatError("Failed to verify backup code");
  }
}
