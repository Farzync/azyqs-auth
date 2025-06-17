const timeMultipliers: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31536000,
};

/**
 * Parse a JWT period string (e.g. "1h", "30m") to seconds.
 *
 * @param period {string|undefined} - The JWT period string
 * @returns {number} The period in seconds
 *
 * Example usage:
 * const seconds = parseJwtPeriodToSeconds('1h');
 */
export function parseJwtPeriodToSeconds(period: string | undefined): number {
  if (!period) throw new Error("JWT_ACCESS_PERIOD is not defined");

  const match = period.match(/^(\d+)([smhdwy])?$/);
  if (!match) throw new Error(`Invalid JWT_ACCESS_PERIOD format: ${period}`);

  const value = parseInt(match[1], 10);
  const unit = match[2] ?? "s";

  return value * (timeMultipliers[unit] ?? 1);
}
