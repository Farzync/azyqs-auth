"use server";

import {
  getCookie,
  formatError,
  signToken,
  setCookie,
  deleteCookie,
  logError,
} from "@/lib/auth";
import { verifyBackupCode } from "@/lib/auth/backupCodes";
import { validateCSRFToken } from "@/lib/auth/csrfToken";
import { prisma } from "@/lib/db";
import { backupCodeVerifySchema } from "@/lib/zod/schemas/backupCode.schema";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";

/**
 * Verify a TOTP backup code for 2FA login and issue a session token if valid.
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
 *
 * Example usage:
 * const result = await verifyTOTPBackupAction({ code, csrfToken });
 */
export async function verifyTOTPBackupAction(input: {
  code: string;
  csrfToken: string;
}) {
  const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
  const tempUserId = await getCookie("temp_user_id");
  if (!tempUserId) {
    return formatError("Session expired, please login again");
  }

  try {
    const parsed = backupCodeVerifySchema.safeParse(input);
    if (!parsed.success) {
      return formatError(
        "Validation error",
        parsed.error.flatten().fieldErrors
      );
    }

    const { code, csrfToken } = parsed.data;

    const isCSRFValid = await validateCSRFToken(csrfToken);
    if (!isCSRFValid) {
      return formatError(
        "Invalid CSRF token. Please refresh the page and try again."
      );
    }

    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: tempUserId },
    });

    if (!userMfaCredential || !userMfaCredential.isEnabled) {
      return formatError("TOTP not enabled");
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
      await setCookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge,
        path: "/",
      });
      await deleteCookie("temp_user_id");
      return { success: true };
    } else {
      return formatError("Invalid backup code");
    }
  } catch (error) {
    logError("Verify Backup Code", error);
    return formatError("Failed to verify backup code");
  }
}
