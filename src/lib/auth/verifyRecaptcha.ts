/**
 * Verifies a Google reCAPTCHA v2 token on the server side.
 *
 * @param {string} token - The reCAPTCHA response token from the client.
 * @returns {Promise<boolean>} True if verification succeeded, false otherwise.
 *
 * @example
 * const isValid = await verifyRecaptcha(token);
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return false;
  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${token}`,
      }
    );
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}
