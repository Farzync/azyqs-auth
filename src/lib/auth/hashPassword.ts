// WARNING: This file uses Node.js-only package (bcryptjs).
// Do NOT import this file in Edge Runtime or middleware. Use only in server-side code.
import bcrypt from "bcryptjs";

/**
 * Hash a password using bcryptjs.
 *
 * @param password {string} - The plain text password
 * @returns {Promise<string>} The hashed password
 *
 * Example usage:
 * const hash = await hashPassword('secret');
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}
