// WARNING: This file uses Node.js-only packages (speakeasy, qrcode).
// Do NOT import this file in Edge Runtime or middleware. Use only in server-side code.
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  manualEntry: string;
}

/**
 * Generate a new MFA secret for a user.
 *
 * @param userEmail {string} - The user's email address
 * @param appName {string} - The app name (issuer)
 * @returns {MFASetup} The MFA secret, QR code URL, and manual entry string
 *
 * Example usage:
 * const mfa = generateMFASecret('user@email.com');
 */
export function generateMFASecret(
  userEmail: string,
  appName: string = "Azyqs Auth Web App"
): MFASetup {
  const secret = speakeasy.generateSecret({
    name: userEmail,
    issuer: appName,
    length: 32,
  });

  return {
    secret: secret.base32!,
    qrCodeUrl: secret.otpauth_url!,
    manualEntry: secret.base32!,
  };
}

/**
 * Generate a QR code (as a data URL) for an MFA otpauth URL.
 *
 * @param otpauthUrl {string} - The otpauth URL for MFA
 * @returns {Promise<string>} The QR code as a data URL
 *
 * Example usage:
 * const qr = await generateMFAQRCode(otpauthUrl);
 */
export async function generateMFAQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch {
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify an MFA code against a secret.
 *
 * @param token {string} - The MFA code from the user
 * @param secret {string} - The MFA secret (base32)
 * @returns {boolean} True if the code is valid, false otherwise
 *
 * Example usage:
 * const isValid = verifyMFACode(code, secret);
 */
export function verifyMFACode(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });
}
