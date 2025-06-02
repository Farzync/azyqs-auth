"use server";

import { formatError, logError } from "@/lib/auth/error";
import { prisma } from "@/lib/db";
import { getProfile } from "@/server/user";

/**
 * Deletes a user credential by its ID for the currently authenticated user.
 *
 * @param {string} credentialId - The ID of the credential to delete.
 * @returns {Promise<{ success: boolean; message: string } | { error: string }>}
 *   Success object if deleted, or error object if failed or unauthorized.
 */
export async function deleteCredentialAction(credentialId: string) {
  try {
    const user = await getProfile();
    if (!user) {
      return formatError("Unauthorized");
    }

    const credential = await prisma.userWebauthnCredential.findFirst({
      where: {
        id: credentialId,
        userId: user.id,
      },
    });

    if (!credential) {
      return formatError("Credential not found");
    }

    await prisma.userWebauthnCredential.delete({
      where: { id: credentialId },
    });

    return { success: true, message: "Credential deleted successfully" };
  } catch (error) {
    logError("deleteCredentialAction", error);
    return formatError("Failed to delete credential");
  }
}
