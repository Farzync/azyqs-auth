"use server";

import { updateProfileSchema } from "@/lib/zod/schemas/updateProfile.schema";
import {
  getCookie,
  getUserFromToken,
  requireValidCSRFToken,
  formatError,
  logError,
} from "@/lib/auth";
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
    return { success: true, data: updated };
  } catch (error) {
    logError("updateProfileAction", error);
    return formatError("Failed to update profile");
  }
}
