"use server";

import { prisma } from "@/lib/db";
import { TokenPayload } from "@/types/token";
import { formatError, getCookie, logError, verifyToken } from "@/lib/auth";

/**
 * Get the TOTP (2FA) status for the authenticated user.
 *
 * @returns {Promise<Object>} Object with isEnabled boolean or error message
 *
 * Side effects:
 * - Reads user security settings from DB
 * - Logs errors on failure
 *
 * Example usage:
 * const status = await getTOTPStatusAction();
 */
export async function getTOTPStatusAction() {
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

    return {
      success: true,
      isEnabled: userMfaCredential?.isEnabled || false,
    };
  } catch (error) {
    logError("Get TOTP status", error);
    return formatError("Failed to get TOTP status");
  }
}
