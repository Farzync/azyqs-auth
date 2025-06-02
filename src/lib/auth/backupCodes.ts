// WARNING: This file uses Node.js-only APIs (crypto, hashPassword, comparePassword).
// Do NOT import this file in Edge Runtime or middleware. Use only in server-side code.
import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth/hashPassword";
import { comparePassword } from "@/lib/auth/comparePassword";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function getRandomChar(): string {
  const index = randomBytes(1)[0] % CHARSET.length;
  return CHARSET.charAt(index);
}

/**
 * Generate an array of random backup codes for TOTP.
 * Each code is 8 uppercase alphanumeric characters (A-Z, 0-9).
 *
 * @param count {number} - Number of codes to generate (default 8)
 * @returns {string[]} Array of backup codes
 *
 * Example usage:
 * const codes = generateBackupCodes();
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += getRandomChar();
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Hash an array of backup codes using bcryptjs.
 *
 * @param codes {string[]} - Array of plain backup codes
 * @returns {Promise<string[]>} Array of hashed codes
 *
 * Example usage:
 * const hashes = await hashBackupCodes(codes);
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => hashPassword(code)));
}

/**
 * Verify a backup code against an array of hashed codes.
 *
 * @param input {string} - The backup code entered by the user
 * @param hashes {string[]} - Array of hashed backup codes
 * @returns {Promise<number|null>} Index of the matching code, or null if not found
 *
 * Example usage:
 * const idx = await verifyBackupCode(input, hashes);
 */
export async function verifyBackupCode(
  input: string,
  hashes: string[]
): Promise<number | null> {
  for (let i = 0; i < hashes.length; i++) {
    if (await comparePassword(input, hashes[i])) {
      return i;
    }
  }
  return null;
}
