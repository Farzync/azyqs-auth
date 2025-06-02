"use server";

import { setCSRFTokenIfMissing } from "@/lib/auth/csrfToken";

/**
 * Get or set a CSRF token cookie for the current session.
 *
 * @returns {Promise<string>} The CSRF token value
 *
 * Side effects:
 * - May set a new CSRF token cookie if missing
 *
 * Example usage:
 * const csrfToken = await getCSRFToken();
 */
export async function getCSRFToken() {
  return await setCSRFTokenIfMissing();
}
