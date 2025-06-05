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
 * const isValid = await bcryptCompare('secret', hash);
 */
export async function bcryptCompare(
  plain: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}

/**
 * Hash a password using bcryptjs.
 *
 * @param password {string} - The plain text password
 * @returns {Promise<string>} The hashed password
 *
 * Example usage:
 * const hash = await bcryptHash('secret');
 */
export async function bcryptHash(secret: string): Promise<string> {
  return await bcrypt.hash(secret, 10);
}
