"use server";

import { prisma } from "@/lib/db";
import { totpSetupSchema } from "@/lib/zod/schemas/totp.schema";
import { z } from "zod";
import { TokenPayload } from "@/types/token";
import { formatError, getCookie, verifyToken, logError } from "@/lib/auth";
import { generateBackupCodes, hashBackupCodes } from "@/lib/auth/backupCodes";
import { validateCSRFToken } from "@/lib/auth/csrfToken";
import { verifyTOTPCode } from "@/lib/auth/totp";

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
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await enableTOTPAction({ code, csrfToken });
 */
export async function enableTOTPAction(input: z.infer<typeof totpSetupSchema>) {
  const parsed = totpSetupSchema.safeParse(input);
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
    const userMfaCredential = await prisma.userMfaCredential.findUnique({
      where: { userId: payload.id },
    });

    if (!userMfaCredential) {
      return formatError("TOTP not setup");
    }

    const isValid = verifyTOTPCode(code, userMfaCredential.secret);
    if (!isValid) {
      return formatError("Invalid TOTP code");
    }

    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    await prisma.userMfaCredential.update({
      where: { userId: payload.id },
      data: { isEnabled: true, backupCodes: hashedBackupCodes },
    });

    return { success: true, backupCodes };
  } catch (error) {
    logError("Enable TOTP", error);
    return formatError("Failed to enable TOTP");
  }
}
