import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_PERIOD = process.env.JWT_REFRESH_PERIOD!;
const JWT_ACCESS_PERIOD = process.env.JWT_ACCESS_PERIOD!;
const accessMaxAge = parseJwtPeriodToSeconds(JWT_ACCESS_PERIOD);
const refreshMaxAge = parseJwtPeriodToSeconds(JWT_REFRESH_PERIOD);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not set. Check Environment Variable.");
}
if (!JWT_ACCESS_PERIOD) {
  throw new Error("JWT_ACCESS_PERIOD not set. Check Environment Variable.");
}
if (!JWT_REFRESH_PERIOD) {
  throw new Error("JWT_REFRESH_PERIOD not set. Check Environment Variable.");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Sign an Access JWT token with the given payload.
 *
 * @param payload {jose.JWTPayload} - The payload to sign
 * @returns {Promise<string>} The signed JWT token
 *
 * Example usage:
 * const token = await signAccessToken({ id: user.id });
 */
export async function signAccessToken(payload: jose.JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(accessMaxAge + "s")
    .sign(secretKey);
  return jwt;
}

/**
 * Sign a Refresh JWT token with the given payload.
 *
 * @param payload {jose.JWTPayload} - The payload to sign
 * @returns {Promise<string>} The signed JWT token
 *
 * Example usage:
 * const token = await signRefreshToken({ id: user.id });
 */
export async function signRefreshToken(payload: jose.JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(refreshMaxAge + "s")
    .sign(secretKey);
  return jwt;
}

/**
 * Verify a JWT token and return its payload if valid.
 *
 * @param token {string} - The JWT token to verify
 * @returns {Promise<T|null>} The decoded payload or null if invalid
 *
 * Example usage:
 * const payload = await verifyToken(token);
 */
export async function verifyToken<T = Record<string, unknown>>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as T;
  } catch {
    return null;
  }
}
