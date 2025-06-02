import { parseJwtPeriodToSeconds } from "@/utils/parseJwtPeriod";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_PERIOD = process.env.JWT_PERIOD!;
const maxAge = parseJwtPeriodToSeconds(JWT_PERIOD);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not set. Check Environment Variable.");
}
if (!JWT_PERIOD) {
  throw new Error("JWT_PERIOD not set. Check Environment Variable.");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Sign a JWT token with the given payload.
 *
 * @param payload {jose.JWTPayload} - The payload to sign
 * @returns {Promise<string>} The signed JWT token
 *
 * Example usage:
 * const token = await signToken({ id: user.id });
 */
export async function signToken(payload: jose.JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(maxAge + "s")
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
