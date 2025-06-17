"use server";

import { deleteCookie } from "@/lib/auth";

/**
 * Log out the current user by deleting the authentication token cookie.
 *
 * @returns {Object} Success object
 *
 * Side effects:
 * - Deletes the "access_token" cookie
 *
 * Example usage:
 * await logoutAction();
 */
export async function logoutAction() {
  await deleteCookie("access_token");
  await deleteCookie("refresh_token");
  return { success: true };
}
