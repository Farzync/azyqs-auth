"use server";

import { formatError, logError } from "@/lib/auth/error";
import { prisma } from "@/lib/db";
import { getProfile } from "@/server/user";

/**
 * Retrieves all WebAuthn credentials for the currently authenticated user.
 *
 * @returns {Promise<{ success: true; credentials: any[] } | { error: string }>}
 *   Success object with credentials array, or error object if unauthorized or failed.
 */
export async function getUserCredentialsAction() {
  try {
    const user = await getProfile();
    if (!user) {
      return formatError("Unauthorized");
    }

    const credentials = await prisma.userWebauthnCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        credentialId: true,
        transports: true,
        createdAt: true,
        deviceName: true,
        deviceOS: true,
        registeredIp: true,
      },
    });

    return { success: true, credentials };
  } catch (error) {
    logError("getUserCredentialsAction", error);
    return formatError("Failed to get user credentials");
  }
}
