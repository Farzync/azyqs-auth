"use server";

import { getCookie, getUserFromToken } from "@/lib/auth";

/**
 * Get the profile data of the currently authenticated user (safe fields only).
 *
 * @returns An object with user profile fields (id, name, username, email, createdAt, updatedAt), or null if not authenticated.
 *
 * Side effects:
 * - Reads authentication token from cookies
 * - Decodes and verifies JWT
 *
 * Example usage:
 * const profile = await getProfile();
 */
export async function getProfile() {
  const token = await getCookie("access_token");
  if (!token) return null;
  const user = await getUserFromToken(token);
  if (!user) return null;
  // Only return safe fields
  const { id, name, username, email, createdAt, updatedAt } = user;
  return { id, name, username, email, createdAt, updatedAt };
}
