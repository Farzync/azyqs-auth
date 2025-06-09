import { useEffect, useState } from "react";
import { getCSRFToken } from "@/server/auth";

/**
 * Custom React hook to fetch and manage CSRF token for forms.
 *
 * @template TFieldNames - (optional) The union type of valid field names for your form (e.g. from react-hook-form).
 * @param {(name: TFieldNames, value: string) => void} [setValue] - Optional setter function (e.g. from react-hook-form) to set the CSRF token field in your form state.
 *
 * @returns {{ csrfToken: string, csrfError: string }}
 *   - csrfToken: The current CSRF token value (empty string if not yet loaded).
 *   - csrfError: Error message if token fetch failed, otherwise empty string.
 *
 * @example
 * // With react-hook-form:
 * const { setValue } = useForm<FormFields>();
 * const { csrfToken, csrfError } = useCsrfToken<FormFields>(setValue);
 *
 * // Without setValue:
 * const { csrfToken, csrfError } = useCsrfToken();
 */
export function useCsrfToken<TFieldNames extends string = string>(
  setValue?: (name: TFieldNames, value: string) => void
) {
  const [csrfToken, setCsrfToken] = useState("");
  const [csrfError, setCsrfError] = useState("");

  useEffect(() => {
    getCSRFToken()
      .then((token) => {
        setCsrfToken(token);
        setValue?.("csrfToken" as TFieldNames, token);
      })
      .catch(() => setCsrfError("Failed to get CSRF token. Please refresh."));
  }, [setValue]);

  return { csrfToken, csrfError };
}
