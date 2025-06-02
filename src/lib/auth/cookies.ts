import { cookies } from "next/headers";

// Get a cookie value by name (async)
/**
 * Get a cookie value by name (async).
 *
 * @param name {string} - The cookie name
 * @returns {Promise<string|undefined>} The cookie value or undefined if not found
 *
 * Example usage:
 * const token = await getCookie('token');
 */
export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

// Set a cookie with options (async)
/**
 * Set a cookie with options (async).
 *
 * @param name {string} - The cookie name
 * @param value {string} - The cookie value
 * @param options {Object} - Cookie options (httpOnly, secure, maxAge, path, expires, sameSite)
 * @returns {Promise<void>}
 *
 * Example usage:
 * await setCookie('token', token, { maxAge: 3600 });
 */
export async function setCookie(
  name: string,
  value: string,
  options: Partial<{
    httpOnly: boolean;
    secure: boolean;
    maxAge: number;
    path: string;
    expires: Date;
    sameSite: "strict" | "lax" | "none";
  }> = {}
): Promise<void> {
  const cookieStore = await cookies();
  await cookieStore.set({
    name,
    value,
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? process.env.NODE_ENV === "production",
    maxAge: options.maxAge,
    path: options.path ?? "/",
    expires: options.expires,
    sameSite: options.sameSite ?? "strict",
  });
}

// Delete a cookie by name (async)
/**
 * Delete a cookie by name (async).
 *
 * @param name {string} - The cookie name
 * @returns {Promise<void>}
 *
 * Example usage:
 * await deleteCookie('token');
 */
export async function deleteCookie(name: string): Promise<void> {
  const cookieStore = await cookies();
  await cookieStore.set({ name, value: "", expires: new Date(0) });
}
