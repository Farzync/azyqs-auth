"use server";

import { getCookie, setCookie, formatError, logError, verifyToken, signToken } from "@/lib/auth";
import { TokenPayload } from "@/types/token";
import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";

/**
 * Refresh JWT access token using a valid refresh token.
 *
 * @returns {Promise<Object>} Success object with new access token or error message
 *
 * Side effects:
 * - Verifies refresh token
 * - Issues new access token
 * - Sets new access token cookie
 * - Logs errors on failure
 */
export async function refreshTokenAction() {
  try {
    const refreshToken = await getCookie("refresh_token");
    if (!refreshToken) {
      return formatError("Refresh token not found");
    }
    const payload = await verifyToken<TokenPayload>(refreshToken);
    if (!payload) {
      return formatError("Invalid refresh token");
    }
    // Issue new access token
    const maxAge = parseJwtPeriodToSeconds(process.env.JWT_PERIOD || "15m");
    const accessToken = await signToken({ id: payload.id });
    await setCookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge,
      path: "/",
    });
    return { success: true };
  } catch (error) {
    logError("refreshTokenAction", error);
    return formatError("Failed to refresh token");
  }
}
