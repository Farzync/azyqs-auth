"use server";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { getCookie, deleteCookie, setCookie } from "@/lib/auth/cookies";
import { prisma } from "@/lib/db";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import { formatError, signAccessToken, logError, signRefreshToken } from "@/lib/auth";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";

const rpID = process.env.AUTH_RP_ID || "localhost";
const origin = process.env.AUTH_ORIGIN || "http://localhost:3000";

/**
 * Verifies a WebAuthn authentication response and issues a session token if successful.
 *
 * @param {AuthenticationResponseJSON} response - The authentication response from the client.
 * @returns {Promise<{ success?: boolean; error?: string; message?: string }>}
 *   Success object if verified, or error object if failed.
 *
 * Side effects:
 * - Verifies WebAuthn authentication response
 * - Updates credential counter
 * - Issues JWT and sets cookie if valid
 * - Creates audit log entry for passkey authentication
 * - Logs errors on failure
 */

export async function verifyPasskeyAction(
  response: AuthenticationResponseJSON
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const timestamp = new Date();
  let userId: string | null = null;
  let username: string | null = null;

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

    userId = credential.user.id;
    username = credential.user.username;

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
      await createUserAuditLog({
        userId,
        action: AuditLogAction.LOGIN,
        details: `Failed passkey authentication for username: ${username} - verification failed`,
        method: AuditLogMethod.PASSKEY,
        success: false,
        errorMessage: "Passkey verification failed",
        at: timestamp,
      });

      return formatError("Authentication failed");
    }

    await prisma.userWebauthnCredential.update({
      where: { id: credential.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD);
    const refreshMaxAge = parseJwtPeriodToSeconds(
      process.env.JWT_REFRESH_PERIOD || "1d"
    );
    const token = await signAccessToken({ id: credential.user.id });
    const refreshToken = await signRefreshToken({ id: credential.user.id });

    await setCookie("access_token", token, {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    await setCookie("refresh_token", refreshToken, {
      maxAge: refreshMaxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    await createUserAuditLog({
      userId,
      action: AuditLogAction.LOGIN,
      details: `Successful passkey authentication for username: ${username}`,
      method: AuditLogMethod.PASSKEY,
      success: true,
      at: timestamp,
    });

    return { success: true, message: "Authentication successful" };
  } catch (error) {
    logError("verifyAuthenticationAction", error);

    if (userId && username) {
      try {
        await createUserAuditLog({
          userId,
          action: AuditLogAction.LOGIN,
          details: `Failed passkey authentication for username: ${username} - system error`,
          method: AuditLogMethod.PASSKEY,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      } catch (auditError) {
        logError(
          "verifyAuthenticationAction - audit log creation failed",
          auditError
        );
      }
    }

    return formatError("Authentication failed");
  } finally {
    await deleteCookie("webauthn_auth_challenge");
  }
}
