import { formatError } from "@/lib/auth";
import { validateCSRFToken } from "@/lib/auth/csrfToken";

/**
 * Require a valid CSRF token, returning an error object if invalid.
 *
 * @param csrfToken {string} - The CSRF token to validate
 * @returns {Promise<null|{error: string}>} Null if valid, error object if invalid
 *
 * Example usage:
 * const error = await requireValidCSRFToken(csrfToken);
 */
export async function requireValidCSRFToken(csrfToken: string) {
  const isValid = await validateCSRFToken(csrfToken);
  if (!isValid) {
    return formatError(
      "Invalid CSRF token. Please refresh the page and try again."
    );
  }
  return null;
}
