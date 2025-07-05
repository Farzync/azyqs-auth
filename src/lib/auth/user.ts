// WARNING: Do NOT import this file in Edge Runtime or middleware.
// It may transitively import server-only code (e.g., Prisma, Node.js APIs).
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { TokenPayload } from "@/types/token";
import { bcryptCompare } from "@/lib/auth/bcrypt";
import { refreshTokenAction } from "@/server/auth/refreshToken";
import { getCookie } from "@/lib/auth";

/**
 * Get user data from a JWT token.
 *
 * @param token {string} - The JWT token
 * @returns {Promise<User|null>} The user object or null if not found/invalid
 *
 * Side effects:
 * - Decodes and verifies JWT
 * - Queries the database for user
 *
 * Example usage:
 * const user = await getUserFromToken(token);
 */
export async function getUserFromToken(token: string) {
  let payload = await verifyToken<TokenPayload>(token);
  if (!payload) {
    const refreshResult = await refreshTokenAction();
    if (refreshResult) {
      const newToken = await getCookie("access_token");
      payload = await verifyToken<TokenPayload>(newToken || "");
    }
  }
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  return user;
}

/**
 * Get user security settings from a JWT token.
 *
 * @param token {string} - The JWT token
 * @returns {Promise<UserMfaCredential|null>} The user MFA credential object or null if not found/invalid
 *
 * Side effects:
 * - Decodes and verifies JWT
 * - Queries the database for user security
 *
 * Example usage:
 * const sec = await getUserMfaCredentialFromToken(token);
 */
export async function getUserMfaCredentialFromToken(token: string) {
  let payload = await verifyToken<TokenPayload>(token);
  if (!payload) {
    const refreshResult = await refreshTokenAction();
    if (refreshResult) {
      const newToken = await getCookie("access_token");
      payload = await verifyToken<TokenPayload>(newToken || "");
    }
  }
  if (!payload) return null;
  const userMfaCredential = await prisma.userMfaCredential.findUnique({
    where: { userId: payload.id },
  });
  return userMfaCredential;
}

/**
 * Verifies user authentication by username and password only.
 * Does not return user data, only authentication status.
 *
 * @param username - The username to verify
 * @param password - The password to verify
 * @returns {Promise<{ success: boolean }>} - { success: true } if credentials are valid, otherwise { success: false }
 *
 * Example:
 *   const result = await verifyUser("alice", "password123");
 *   if (result.success) { ... }
 */
export async function verifyUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { password: true },
  });

  if (!user) return { success: false };

  const isValidPassword = await bcryptCompare(password, user.password);
  if (!isValidPassword) return { success: false };

  return { success: true };
}
