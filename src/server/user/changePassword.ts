"use server";

import { changePasswordSchema } from "@/lib/zod/schemas/changePassword.schema";
import {
  requireValidCSRFToken,
  getCookie,
  getUserFromToken,
  formatError,
  logError,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/auth/comparePassword";
import { hashPassword } from "@/lib/auth/hashPassword";

/**
 * Change the password of the currently authenticated user.
 *
 * @param data {unknown} - The input data (should match changePasswordSchema)
 * @returns {Object} Success object or error message with issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks current password
 * - Updates password in database
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await changePasswordAction({ currentPassword, newPassword, csrfToken });
 */
export async function changePasswordAction(data: unknown) {
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Validation error",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const token = await getCookie("token");
  if (!token) return formatError("Unauthorized");
  const user = await getUserFromToken(token);
  if (!user) return formatError("User not Found");

  const { currentPassword, newPassword, csrfToken } = parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) return csrfError;

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) return formatError("Current Password is Incorrect");

  try {
    const hashedNew = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNew },
    });
    return { success: true };
  } catch (error) {
    logError("changePasswordAction", error);
    return formatError("Failed to change password");
  }
}
