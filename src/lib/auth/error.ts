/**
 * Format an error message for API/server responses.
 *
 * @param message {string} - The error message
 * @param issues {Record<string, string[]>} [optional] - Field validation issues
 * @returns {Object} Error object for response
 *
 * Example usage:
 * return formatError('Validation failed', { email: ['Invalid email'] });
 */
export function formatError(
  message: string,
  issues?: Record<string, string[]>
): { error: string; issues?: Record<string, string[]> } {
  return issues ? { error: message, issues } : { error: message };
}

/**
 * Log an error to the server console with context.
 *
 * @param context {string} - The context or function name
 * @param error {unknown} - The error object
 *
 * Example usage:
 * logError('registerAction', error);
 */
export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}
