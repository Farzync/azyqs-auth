import { prisma } from "@/lib/db";
// WARNING: Do NOT import this file in Edge Runtime or middleware.
// It may transitively import server-only code (e.g., Prisma, Node.js APIs).
import { verifyToken } from "@/lib/auth/jwt";
import { TokenPayload } from "@/types/token";

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
  const payload = await verifyToken<TokenPayload>(token);
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
  const payload = await verifyToken<TokenPayload>(token);
  if (!payload) return null;
  const userMfaCredential = await prisma.userMfaCredential.findUnique({
    where: { userId: payload.id },
  });
  return userMfaCredential;
}
