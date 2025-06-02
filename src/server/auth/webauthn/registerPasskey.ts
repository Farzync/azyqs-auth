"use server";

import { verifyPasskeyRegistrationResponse } from "@/lib/auth/webauthn";
import { getProfile } from "@/server/user";
import { formatError, logError } from "@/lib/auth/error";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/utils/getClientIp";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction } from "@/types/auditlog";

/**
 * Registers a new WebAuthn passkey credential for the currently authenticated user.
 *
 * @param {RegistrationResponseJSON} response - The registration response from the client.
 * @param {{ deviceName?: string; deviceOS?: string }} [deviceInfo] - Optional device info to associate with the credential.
 * @returns {Promise<{ success: boolean; message: string } | { error: string }>}
 *   Success object if registered, or error object if failed or unauthorized.
 *
 * Side effects:
 * - Verifies passkey registration response
 * - Creates new WebAuthn credential in database
 * - Creates audit log entry for passkey registration
 * - Logs errors on failure
 */
export async function registerPasskeyAction(
  response: RegistrationResponseJSON,
  deviceInfo?: { deviceName?: string; deviceOS?: string }
) {
  const timestamp = new Date();

  try {
    const user = await getProfile();
    if (!user) {
      return formatError("Unauthorized");
    }

    const verification = await verifyPasskeyRegistrationResponse(
      user.id,
      response
    );

    if (!verification || !verification.verified) {
      await createUserAuditLog({
        userId: user.id,
        action: AuditLogAction.REGISTER_PASSKEY,
        details: `Failed passkey registration for username: ${user.username} - verification failed`,
        success: false,
        errorMessage: "Passkey registration verification failed",
        at: timestamp,
      });

      return formatError("Passkey registration failed");
    }

    let credentialId: string;
    if (typeof verification.registrationInfo!.credential.id === "string") {
      credentialId = verification.registrationInfo!.credential.id;
    } else {
      credentialId = Buffer.from(
        verification.registrationInfo!.credential.id
      ).toString("base64url");
    }

    const publicKeyBuffer = verification.registrationInfo!.credential.publicKey;
    const publicKeyBase64 = Buffer.from(publicKeyBuffer).toString("base64");

    const registeredIp = await getClientIp();

    await prisma.userWebauthnCredential.create({
      data: {
        userId: user.id,
        credentialId,
        publicKey: publicKeyBase64,
        counter: verification.registrationInfo!.credential.counter,
        transports: response.response.transports || [],
        deviceName: deviceInfo?.deviceName || null,
        deviceOS: deviceInfo?.deviceOS || null,
        registeredIp,
      },
    });

    const deviceDetails =
      deviceInfo?.deviceName && deviceInfo?.deviceOS
        ? `${deviceInfo.deviceName} - ${deviceInfo.deviceOS}`
        : "Unknown device";

    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.REGISTER_PASSKEY,
      details: `Passkey successfully registered for username: ${user.username} on device: ${deviceDetails}`,
      success: true,
      at: timestamp,
    });

    return { success: true, message: "Passkey registered successfully" };
  } catch (error) {
    logError("registerPasskeyAction", error);
    try {
      const user = await getProfile();
      if (user) {
        await createUserAuditLog({
          userId: user.id,
          action: AuditLogAction.REGISTER_PASSKEY,
          details: `Failed passkey registration for username: ${user.username} - system error`,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      }
    } catch (auditError) {
      logError("registerPasskeyAction - audit log creation failed", auditError);
    }

    return formatError("Failed to register passkey");
  }
}
