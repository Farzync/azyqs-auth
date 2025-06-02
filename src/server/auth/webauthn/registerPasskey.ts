"use server";

import { verifyPasskeyRegistrationResponse } from "@/lib/auth/webauthn";
import { getProfile } from "@/server/user";
import { formatError, logError } from "@/lib/auth/error";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/utils/getClientIp";

import type { RegistrationResponseJSON } from "@simplewebauthn/types";

/**
 * Registers a new WebAuthn passkey credential for the currently authenticated user.
 *
 * @param {RegistrationResponseJSON} response - The registration response from the client.
 * @param {{ deviceName?: string; deviceOS?: string }} [deviceInfo] - Optional device info to associate with the credential.
 * @returns {Promise<{ success: boolean; message: string } | { error: string }>}
 *   Success object if registered, or error object if failed or unauthorized.
 */
export async function registerPasskeyAction(
  response: RegistrationResponseJSON,
  deviceInfo?: { deviceName?: string; deviceOS?: string }
) {
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

    return { success: true, message: "Passkey registered successfully" };
  } catch (error) {
    logError("registerPasskeyAction", error);
    return formatError("Failed to register passkey");
  }
}
