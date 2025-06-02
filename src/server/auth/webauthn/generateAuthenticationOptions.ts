"use server";

import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { GenerateAuthenticationOptionsOpts } from "@simplewebauthn/server";
import { setCookie } from "@/lib/auth/cookies";
import { prisma } from "@/lib/db";
import { formatError, logError } from "@/lib/auth/error";

const rpID = process.env.AUTH_RP_ID || "localhost";

/**
 * Generates WebAuthn authentication options for a user or all credentials if username is not provided.
 *
 * @param {string} [username] - Optional username to filter credentials for a specific user.
 * @returns {Promise<{ success: true; options: any } | { error: string }>}
 *   Success object with authentication options, or error object if failed.
 */
export async function generateAuthenticationOptionsAction(username?: string) {
  try {
    let allowCredentials;
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        include: { UserWebauthnCredential: true },
      });
      if (user && user.UserWebauthnCredential.length > 0) {
        allowCredentials = user.UserWebauthnCredential.map((cred) => {
          let id = cred.credentialId;
          if (typeof id !== "string") {
            id = Buffer.from(id).toString("base64url");
          }
          return {
            id,
            transports: cred.transports as AuthenticatorTransport[] | undefined,
          };
        });
      }
    } else {
      const allCreds = await prisma.userWebauthnCredential.findMany();
      if (allCreds.length > 0) {
        allowCredentials = allCreds.map((cred) => {
          let id = cred.credentialId;
          if (typeof id !== "string") {
            id = Buffer.from(id).toString("base64url");
          }
          return {
            id,
            transports: cred.transports as AuthenticatorTransport[] | undefined,
          };
        });
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
      timeout: 60000,
    } satisfies GenerateAuthenticationOptionsOpts);

    await setCookie("webauthn_auth_challenge", options.challenge, {
      maxAge: 60,
    });

    return { success: true, options };
  } catch (error) {
    logError("generateAuthenticationOptionsAction", error);
    return formatError("Failed to generate authentication options");
  }
}
