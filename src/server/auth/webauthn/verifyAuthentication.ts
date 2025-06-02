"use server";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { getCookie, deleteCookie, setCookie } from "@/lib/auth/cookies";
import { prisma } from "@/lib/db";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { formatError, signToken, logError } from "@/lib/auth";

const rpID = process.env.AUTH_RP_ID || "localhost";
const origin = process.env.AUTH_ORIGIN || "http://localhost:3000";

/**
 * Verifies a WebAuthn authentication response and issues a session token if successful.
 *
 * @param {AuthenticationResponseJSON} response - The authentication response from the client.
 * @returns {Promise<{ success?: boolean; error?: string; message?: string }>}
 *   Success object if verified, or error object if failed.
 */
export async function verifyAuthenticationAction(
  response: AuthenticationResponseJSON
): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    const expectedChallenge = await getCookie("webauthn_auth_challenge");

    if (!expectedChallenge) {
      return formatError("Authentication challenge not found");
    }

    const credentialIdBase64url = response.id;
    let credential = await prisma.userWebauthnCredential.findUnique({
      where: {
        credentialId: credentialIdBase64url,
      },
      include: {
        user: true,
      },
    });
    if (!credential) {
      try {
        const asBuffer = Buffer.from(credentialIdBase64url, "base64url");
        credential = await prisma.userWebauthnCredential.findFirst({
          where: {
            credentialId: asBuffer.toString("base64url"),
          },
          include: {
            user: true,
          },
        });
      } catch {}
    }
    if (!credential) {
      return formatError("Credential not found");
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: credential.credentialId,
        publicKey: Buffer.from(credential.publicKey, "base64"),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      return formatError("Authentication failed");
    }

    await prisma.userWebauthnCredential.update({
      where: { id: credential.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
    const token = await signToken({
      id: credential.user.id,
      username: credential.user.username,
      email: credential.user.email,
    });

    await setCookie("token", token, {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return { success: true, message: "Authentication successful" };
  } catch (error) {
    logError("verifyAuthenticationAction", error);
    return formatError("Authentication failed");
  } finally {
    await deleteCookie("webauthn_auth_challenge");
  }
}
