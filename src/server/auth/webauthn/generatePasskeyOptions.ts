"use server";

import { generatePasskeyRegistrationOptions } from "@/lib/auth/webauthn";
import { getProfile } from "@/server/user";
import { formatError, logError } from "@/lib/auth/error";

/**
 * Generates WebAuthn passkey registration options for the currently authenticated user.
 *
 * @returns {Promise<{ success: true; options: any } | { error: string }>}
 *   Success object with registration options, or error object if unauthorized or failed.
 */
export async function generatePasskeyOptionsAction() {
  try {
    const user = await getProfile();
    if (!user) {
      return formatError("Unauthorized");
    }

    const options = await generatePasskeyRegistrationOptions(
      user.username,
      user.id
    );

    return { success: true, options };
  } catch (error) {
    logError("generatePasskeyOptionsAction", error);
    return formatError("Failed to generate passkey options");
  }
}
