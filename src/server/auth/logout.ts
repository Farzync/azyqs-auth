"use server";

import { deleteCookie } from "@/lib/auth";

/**
 * Log out the current user by deleting the authentication token cookie.
 *
 * @returns {Object} Success object
 *
 * Side effects:
 * - Deletes the "token" cookie
 *
 * Example usage:
 * await logoutAction();
 */
export async function logoutAction() {
  await deleteCookie("token");
  return { success: true };
}
