"use server";

import { deleteAccountSchema } from "@/lib/zod/schemas/deleteAccount.schema";
import {
  requireValidCSRFToken,
  getCookie,
  getUserFromToken,
  formatError,
  logError,
  deleteCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/auth/comparePassword";

/**
 * Delete the currently authenticated user's account after password and CSRF validation.
 *
 * @param data {unknown} - The input data (should match deleteAccountSchema)
 * @returns {Object} Success object or error message with issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Checks password
 * - Deletes user from database
 * - Deletes authentication cookie
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await deleteAccountAction({ password, csrfToken });
 */
export async function deleteAccountAction(data: unknown) {
  const parsed = deleteAccountSchema.safeParse(data);
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

  const { password, csrfToken } = parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) return csrfError;

  const isValid = await comparePassword(password, user.password);
  if (!isValid) return formatError("Incorrect Password");

  try {
    await prisma.user.delete({ where: { id: user.id } });
    await deleteCookie("token");
    return { success: true };
  } catch (error) {
    logError("deleteAccountAction", error);
    return formatError("Failed to delete account");
  }
}
