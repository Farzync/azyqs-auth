import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/auth/comparePassword";

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

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) return { success: false };

  return { success: true };
}
