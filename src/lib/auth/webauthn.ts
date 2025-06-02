import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { getCookie, setCookie, deleteCookie } from "@/lib/auth/cookies";

const rpName = "Azyqs Passkey Auth";
const rpID = process.env.AUTH_RP_ID || "localhost";
const origin = process.env.AUTH_ORIGIN || "http://localhost:3000";

/**
 * Generates WebAuthn passkey registration options for a user.
 *
 * @param {string} username - The username of the user.
 * @param {string} userId - The user ID.
 * @returns {Promise<any>} The registration options for WebAuthn.
 */
export async function generatePasskeyRegistrationOptions(
  username: string,
  userId: string
) {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(userId, "utf-8"),
    userName: username,
    timeout: 60000,
    attestationType: "none",
    authenticatorSelection: {
      userVerification: "preferred",
      residentKey: "discouraged",
    },
    supportedAlgorithmIDs: [-7, -257],
  } satisfies GenerateRegistrationOptionsOpts);

  await setCookie("webauthn_challenge", options.challenge, {
    maxAge: 60,
  });

  return options;
}

/**
 * Verifies a WebAuthn passkey registration response for a user.
 *
 * @param {string} userId - The user ID.
 * @param {RegistrationResponseJSON} response - The registration response from the client.
 * @returns {Promise<VerifiedRegistrationResponse | null>} The verification result, or null if failed.
 */
export async function verifyPasskeyRegistrationResponse(
  userId: string,
  response: RegistrationResponseJSON
): Promise<VerifiedRegistrationResponse | null> {
  const expectedChallenge = await getCookie("webauthn_challenge");
  if (!expectedChallenge) return null;

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    } satisfies VerifyRegistrationResponseOpts);

    if (!verification.verified) return null;

    return verification;
  } catch (err) {
    console.error("Error verifying registration response:", err);
    return null;
  } finally {
    await deleteCookie("webauthn_challenge");
  }
}
