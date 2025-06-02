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
} from "@/lib/auth";
import { z } from "zod";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { comparePassword } from "@/lib/auth/comparePassword";

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
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await loginAction({ username, password, recaptchaToken, csrfToken });
 */
export async function loginAction(input: z.infer<typeof loginSchema>) {
  const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Validation error",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, password, recaptchaToken, csrfToken } = parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) return csrfError;

  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return formatError("reCAPTCHA verification failed. Please try again.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { UserMfaCredential: true },
    });

    if (!user) return formatError("Username or password is incorrect");
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword)
      return formatError("Username or password is incorrect");

    const userMfaCredential = user.UserMfaCredential[0];
    const isTotpEnabled = userMfaCredential?.isEnabled || false;

    if (isTotpEnabled) {
      await setCookie("temp_user_id", user.id, { maxAge: 300 });
      return {
        success: true,
        totp_required: true,
      };
    } else {
      const token = await signToken({ id: user.id });
      await setCookie("token", token, { maxAge });
      return { success: true };
    }
  } catch (error) {
    logError("loginAction", error);
    return formatError("Login failed");
  }
}
