"use server";

import { prisma } from "@/lib/db";
import { totpDisableSchema } from "@/lib/zod/schemas/totp.schema";
import { z } from "zod";
import { TokenPayload } from "@/types/token";
import { formatError, verifyToken, logError, getCookie } from "@/lib/auth";
import { validateCSRFToken } from "@/lib/auth/csrfToken";
import { comparePassword } from "@/lib/auth/comparePassword";

/**
 * Disable TOTP (2FA) for the authenticated user after password and CSRF validation.
 *
 * @param input {z.infer<typeof totpDisableSchema>} - The input object with password and CSRF token
 * @returns {Promise<Object>} Success object or error message
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks password
 * - Disables TOTP in DB
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await disableTOTPAction({ password, csrfToken });
 */
export async function disableTOTPAction(
  input: z.infer<typeof totpDisableSchema>
) {
  const parsed = totpDisableSchema.safeParse(input);
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
      return formatError("User not found");
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return formatError("Incorrect password");
    }

    await prisma.userMfaCredential.update({
      where: { userId: payload.id },
      data: { isEnabled: false },
    });

    return { success: true };
  } catch (error) {
    logError("Disable TOTP", error);
    return formatError("Failed to disable TOTP");
  }
}
