"use server";

import { loginSchema } from "@/lib/zod/schemas/login.schema";
import { prisma } from "@/lib/db";
import {
  signToken,
  verifyRecaptcha,
  setCookie,
  requireValidCSRFToken,
  formatError,
  logError,
  verifyUser,
} from "@/lib/auth";
import { z } from "zod";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";
import { getClientIp } from "@/utils/getClientIp";
import { checkRateLimit } from "@/lib/auth/rateLimit";

/**
 * Authenticate a user and set a JWT cookie if credentials are valid.
 *
 * @param input {z.infer<typeof loginSchema>} - The login data (username, password, recaptchaToken, csrfToken)
 * @returns {Object} Success object or error message with issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Validates reCAPTCHA
 * - Checks user credentials
 * - Sets authentication cookie
 * - Creates audit log entry for login attempt
 * - Logs errors on failure
 * - Applies rate limiting: blocks after 5 failed attempts in 5 minutes per user and IP
 *
 * Example usage:
 * const result = await loginAction({ username, password, recaptchaToken, csrfToken });
 */
export async function loginAction(input: z.infer<typeof loginSchema>) {
  const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
  const parsed = loginSchema.safeParse(input);
  const timestamp = new Date();

  if (!parsed.success) {
    return {
      error: "Validation error",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, password, recaptchaToken, csrfToken } = parsed.data;

  const userForRateLimit = await prisma.user.findUnique({
    where: { username },
  });
  let clientIp = "";
  try {
    clientIp = (await getClientIp()) || "";
  } catch {}
  if (userForRateLimit && clientIp) {
    const isRateLimited = await checkRateLimit(
      userForRateLimit.id,
      clientIp,
      AuditLogAction.LOGIN,
      AuditLogMethod.PASSWORD,
      5 * 60 * 1000,
      5
    );
    if (isRateLimited) {
      await createUserAuditLog({
        userId: userForRateLimit.id,
        action: AuditLogAction.LOGIN,
        details: `Blocked login due to too many failed attempts from IP ${clientIp}`,
        method: AuditLogMethod.PASSWORD,
        success: false,
        errorMessage: "Too many failed login attempts",
        at: new Date(),
        ipAddress: clientIp,
      });
      return formatError(
        "Too many failed login attempts. Please try again later."
      );
    }
  }

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) {
    return csrfError;
  }

  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return formatError("reCAPTCHA verification failed. Please try again.");
  }

  try {
    const verifyResult = await verifyUser(username, password);

    if (!verifyResult.success) {
      const userFromDb = await prisma.user.findUnique({ where: { username } });
      if (userFromDb) {
        await createUserAuditLog({
          userId: userFromDb.id,
          action: AuditLogAction.LOGIN,
          details: `Failed login attempt for username: ${username}`,
          method: AuditLogMethod.PASSWORD,
          success: false,
          errorMessage: "Incorrect password",
          at: timestamp,
        });
      }
      return formatError("Username or password is incorrect");
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { UserMfaCredential: true },
    });

    if (!user) {
      return formatError("User not found after authentication");
    }

    const userMfaCredential = user.UserMfaCredential[0];
    const isMfaEnabled = userMfaCredential?.isEnabled || false;

    if (isMfaEnabled) {
      await createUserAuditLog({
        userId: user.id,
        action: AuditLogAction.LOGIN,
        details: `Login successful for username: ${username} - Login pending MFA verification`,
        method: AuditLogMethod.PASSWORD,
        success: true,
        at: timestamp,
      });

      await setCookie("temp_user_id", user.id, { maxAge: 300 });
      return {
        success: true,
        mfa_required: true,
      };
    } else {
      await createUserAuditLog({
        userId: user.id,
        action: AuditLogAction.LOGIN,
        details: `Successful login for username: ${username}`,
        method: AuditLogMethod.PASSWORD,
        success: true,
        at: timestamp,
      });

      const token = await signToken({ id: user.id });
      await setCookie("token", token, { maxAge });
      return { success: true };
    }
  } catch (error) {
    logError("loginAction", error);
    return formatError("Login failed");
  }
}
