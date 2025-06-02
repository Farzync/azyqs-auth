"use server";

// WARNING: This file uses Node.js-only API (crypto.randomBytes).
// Do NOT import this file in Edge Runtime or middleware. Use only in server-side code.
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

/**
 * Validate a CSRF token against the stored cookie value.
 *
 * @param csrfToken {string} - The CSRF token to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 *
 * Example usage:
 * const isValid = await validateCSRFToken(csrfToken);
 */
export async function validateCSRFToken(csrfToken: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("csrf_token")?.value;
  return !!cookieToken && csrfToken === cookieToken;
}

/**
 * Set a CSRF token cookie if it does not already exist.
 *
 * @returns {Promise<string>} The CSRF token value
 *
 * Side effects:
 * - May set a new CSRF token cookie
 *
 * Example usage:
 * const token = await setCSRFTokenIfMissing();
 */
export async function setCSRFTokenIfMissing() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get("csrf_token")?.value;

  if (!existingToken) {
    const token = randomBytes(32).toString("hex");
    cookieStore.set({
      name: "csrf_token",
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 5,
      path: "/",
    });
    return token;
  }
  return existingToken;
}
