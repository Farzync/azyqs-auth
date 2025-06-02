"use server";

import { updateProfileSchema } from "@/lib/zod/schemas/updateProfile.schema";
import {
  getCookie,
  getUserFromToken,
  requireValidCSRFToken,
  formatError,
  logError,
} from "@/lib/auth";
import { createUserAuditLog } from "@/lib/auditLog";
import { AuditLogAction } from "@/types/auditlog";
import { prisma } from "@/lib/db";

/**
 * Update the profile information of the currently authenticated user.
 *
 * @param data {unknown} - The input data to update the profile (should match updateProfileSchema)
 * @returns An object with either the updated user data or an error message and issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks for email/username uniqueness
 * - Updates user data in the database
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await updateProfileAction({ name, email, username, csrfToken });
 */
export async function updateProfileAction(data: unknown) {
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Validasi gagal",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const token = await getCookie("token");
  if (!token) return formatError("Unauthorized");
  const user = await getUserFromToken(token);
  if (!user) return formatError("Unauthorized");

  const { name, email, username, csrfToken } = parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) return csrfError;

  try {
    const isEmailTaken = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: user.id },
      },
    });
    if (isEmailTaken) return formatError("Email is already been used");

    const isUsernameTaken = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: user.id },
      },
    });
    if (isUsernameTaken) return formatError("Username is already been");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, email, username },
    });

    await createUserAuditLog({
      userId: user.id,
      action: AuditLogAction.EDIT_PROFILE,
      details: `Profile updated: name=${name}, email=${email}, username=${username}`,
      success: true,
      at: new Date(),
    });

    return { success: true, data: updated };
  } catch (error) {
    logError("updateProfileAction", error);
    try {
      if (user?.id) {
        await createUserAuditLog({
          userId: user.id,
          action: AuditLogAction.EDIT_PROFILE,
          details: `Profile update failed`,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          at: new Date(),
        });
      }
    } catch (auditError) {
      logError("updateProfileAction.audit", auditError);
    }
    return formatError("Failed to update profile");
  }
}
