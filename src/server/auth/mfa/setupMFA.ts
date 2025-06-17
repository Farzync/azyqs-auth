"use server";

import { prisma } from "@/lib/db";
import { TokenPayload } from "@/types/token";
import { formatError, getCookie, logError, verifyToken } from "@/lib/auth";
import { generateMFASecret, generateMFAQRCode } from "@/lib/auth/mfa";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";

/**
 * Set up a new MFA secret for the authenticated user and return QR code data.
 *
 * @returns {Promise<Object>} Object with QR code data URL and secret, or error message
 *
 * Side effects:
 * - Generates and stores new MFA secret
 * - Generates QR code for authenticator app
 * - Updates user security settings in DB
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await setupMFAAction();
 */
export async function setupMFAAction() {
  const token = await getCookie("access_token");
  if (!token) {
    return formatError("Not authenticated");
  }
  const payload = await verifyToken<TokenPayload>(token);
  if (!payload) {
    return formatError("Invalid token");
  }

  const timestamp = new Date();
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { UserMfaCredential: true },
    });

    if (!user) {
      await createUserAuditLog({
        userId: payload.id,
        action: AuditLogAction.ENABLE_MFA,
        details: `Attempted MFA setup but user not found`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage: "User not found",
        at: timestamp,
      });
      return formatError("User not found");
    }

    if (!user.username || user.username.trim() === "") {
      await createUserAuditLog({
        userId: user.id,
        action: AuditLogAction.ENABLE_MFA,
        details: `Attempted MFA setup but username missing`,
        method: AuditLogMethod.MFA,
        success: false,
        errorMessage:
          "Username is missing. Cannot generate MFA without username.",
        at: timestamp,
      });
      return formatError(
        "Username is missing. Cannot generate MFA without username."
      );
    }

    const mfaSetup = generateMFASecret(`Azyqs Web Auth: ${user.username}`);
    const qrCodeDataUrl = await generateMFAQRCode(mfaSetup.qrCodeUrl);

    await prisma.userMfaCredential.upsert({
      where: { userId: user.id },
      update: {
        secret: mfaSetup.secret,
        isEnabled: false,
      },
      create: {
        userId: user.id,
        secret: mfaSetup.secret,
        isEnabled: false,
      },
    });

    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.ENABLE_MFA,
      details: `MFA setup (secret generated) for username: ${user.username}`,
      method: AuditLogMethod.MFA,
      success: true,
      at: timestamp,
    });

    return {
      success: true,
      qrCode: qrCodeDataUrl,
      manualEntry: mfaSetup.manualEntry,
    };
  } catch (error) {
    logError("Setup MFA", error);
    try {
      if (payload.id) {
        await createUserAuditLog({
          userId: payload.id,
          action: AuditLogAction.ENABLE_MFA,
          details: `Failed to setup MFA`,
          method: AuditLogMethod.MFA,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      }
    } catch (auditError) {
      logError("setupTOTPAction.audit", auditError);
    }
    return formatError("Failed to setup MFA");
  }
}
