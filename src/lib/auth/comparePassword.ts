// WARNING: This file uses Node.js-only package (bcryptjs).
// Do NOT import this file in Edge Runtime or middleware. Use only in server-side code.
import bcrypt from "bcryptjs";

/**
 * Compare a plain password with a hashed password using bcryptjs.
 *
 * @param plain {string} - The plain text password
 * @param hash {string} - The hashed password
 * @returns {Promise<boolean>} True if match, false otherwise
 *
 * Example usage:
 * const isValid = await comparePassword('secret', hash);
 */
export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}
