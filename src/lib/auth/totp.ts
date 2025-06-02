// WARNING: This file uses Node.js-only packages (speakeasy, qrcode).
// Do NOT import this file in Edge Runtime or middleware. Use only in server-side code.
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntry: string;
}

/**
 * Generate a new TOTP secret for a user.
 *
 * @param userEmail {string} - The user's email address
 * @param appName {string} - The app name (issuer)
 * @returns {TOTPSetup} The TOTP secret, QR code URL, and manual entry string
 *
 * Example usage:
 * const totp = generateTOTPSecret('user@email.com');
 */
export function generateTOTPSecret(
  userEmail: string,
  appName: string = "Azyqs Auth Web App"
): TOTPSetup {
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
 * Generate a QR code (as a data URL) for a TOTP otpauth URL.
 *
 * @param otpauthUrl {string} - The otpauth URL for TOTP
 * @returns {Promise<string>} The QR code as a data URL
 *
 * Example usage:
 * const qr = await generateQRCode(otpauthUrl);
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch {
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify a TOTP code against a secret.
 *
 * @param token {string} - The TOTP code from the user
 * @param secret {string} - The TOTP secret (base32)
 * @returns {boolean} True if the code is valid, false otherwise
 *
 * Example usage:
 * const isValid = verifyTOTPCode(code, secret);
 */
export function verifyTOTPCode(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });
}
