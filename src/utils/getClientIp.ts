import { cookies, headers } from "next/headers";

/**
 * Helper to get client IP address from headers or cookies.
 *
 * @returns {Promise<string|null>} The client IP address or null if not found.
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const xff = (await headers()).get("x-forwarded-for");
    if (xff) {
      return xff.split(",")[0].trim();
    }
    return (await cookies()).get("client-ip")?.value || null;
  } catch {
    return null;
  }
}
