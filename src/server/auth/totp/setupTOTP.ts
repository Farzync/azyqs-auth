"use server";

import { prisma } from "@/lib/db";
import { TokenPayload } from "@/types/token";
import { formatError, getCookie, logError, verifyToken } from "@/lib/auth";
import { generateTOTPSecret, generateQRCode } from "@/lib/auth/totp";

/**
 * Set up a new TOTP secret for the authenticated user and return QR code data.
 *
 * @returns {Promise<Object>} Object with QR code data URL and secret, or error message
 *
 * Side effects:
 * - Generates and stores new TOTP secret
 * - Generates QR code for authenticator app
 * - Updates user security settings in DB
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await setupTOTPAction();
 */
export async function setupTOTPAction() {
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
      include: { UserMfaCredential: true },
    });

    if (!user) {
      return formatError("User not found");
    }

    if (!user.username || user.username.trim() === "") {
      return formatError(
        "Username is missing. Cannot generate TOTP without username."
      );
    }

    const totpSetup = generateTOTPSecret(`Azyqs Web Auth: ${user.username}`);
    const qrCodeDataUrl = await generateQRCode(totpSetup.qrCodeUrl);

    await prisma.userMfaCredential.upsert({
      where: { userId: user.id },
      update: {
        secret: totpSetup.secret,
        isEnabled: false,
      },
      create: {
        userId: user.id,
        secret: totpSetup.secret,
        isEnabled: false,
      },
    });

    return {
      success: true,
      qrCode: qrCodeDataUrl,
      manualEntry: totpSetup.manualEntry,
    };
  } catch (error) {
    logError("Setup TOTP", error);
    return formatError("Failed to setup TOTP");
  }
}
