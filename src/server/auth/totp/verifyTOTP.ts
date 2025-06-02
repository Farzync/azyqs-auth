"use server";

import {
  getCookie,
  formatError,
  signToken,
  setCookie,
  deleteCookie,
  logError,
} from "@/lib/auth";
import { validateCSRFToken } from "@/lib/auth/csrfToken";
import { verifyTOTPCode } from "@/lib/auth/totp";
import { prisma } from "@/lib/db";
import { totpVerifySchema } from "@/lib/zod/schemas/totp.schema";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";

/**
 * Verify a TOTP code for 2FA login and issue a session token if valid.
 *
 * @param input {Object} - The input object containing TOTP code and CSRF token
 * @param input.code {string} - The TOTP code entered by the user
 * @param input.csrfToken {string} - The CSRF token for validation
 * @returns {Promise<Object>} Success object with session or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks TOTP code against stored secret
 * - Issues JWT and sets cookie if valid
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await verifyTOTPAction({ code, csrfToken });
 */
export async function verifyTOTPAction(input: {
  code: string;
  csrfToken: string;
}) {
  const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
  const tempUserId = await getCookie("temp_user_id");
  if (!tempUserId) {
    return formatError("Session expired, please login again");
  }

  try {
    const parsed = totpVerifySchema.safeParse(input);
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

    const isValid = verifyTOTPCode(code, userMfaCredential.secret);
    if (!isValid) {
      return formatError("Invalid TOTP code");
    }
    const token = await signToken({ id: tempUserId });
    await setCookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge,
      path: "/",
    });
    await deleteCookie("temp_user_id");
    return { success: true };
  } catch (error) {
    logError("Verify TOTP", error);
    return formatError("Failed to verify TOTP");
  }
}
