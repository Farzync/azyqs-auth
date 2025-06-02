"use server";

import { formatError, logError } from "@/lib/auth/error";
import { prisma } from "@/lib/db";
import { getProfile } from "@/server/user";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction } from "@/types/auditlog";

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
    const timestamp = new Date();
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
      await createUserAuditLog({
        userId: user.id,
        action: AuditLogAction.UNREGISTER_PASSKEY,
        details: `Attempted to delete credential but not found (id: ${credentialId})`,
        success: false,
        errorMessage: "Credential not found",
        at: timestamp,
      });
      return formatError("Credential not found");
    }

    await prisma.userWebauthnCredential.delete({
      where: { id: credentialId },
    });
    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.UNREGISTER_PASSKEY,
      details: `Credential deleted (id: ${credentialId})`,
      success: true,
      at: timestamp,
    });
    return { success: true, message: "Credential deleted successfully" };
  } catch (error) {
    logError("deleteCredentialAction", error);
    try {
      const user = await getProfile();
      if (user) {
        await createUserAuditLog({
          userId: user.id,
          action: AuditLogAction.UNREGISTER_PASSKEY,
          details: `Failed to delete credential (system error) (id: ${credentialId})`,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: new Date(),
        });
      }
    } catch {}
    return formatError("Failed to delete credential");
  }
}
