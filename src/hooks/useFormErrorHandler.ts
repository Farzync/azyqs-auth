import { useState } from "react";

/**
 * Custom React hook for consistent form error handling.
 *
 * @returns {{
 *   errorMsg: string;
 *   setErrorMsg: (msg: string) => void;
 *   clearErrorMsg: () => void;
 * }}
 *   - errorMsg: Current error message (empty string if none)
 *   - setErrorMsg: Function to set the error message
 *   - clearErrorMsg: Function to clear the error message
 *
 * @example
 * const { errorMsg, setErrorMsg, clearErrorMsg } = useFormErrorHandler();
 * setErrorMsg("Invalid credentials");
 * clearErrorMsg();
 */
export function useFormErrorHandler() {
  const [errorMsg, setErrorMsg] = useState("");
  const clearErrorMsg = () => setErrorMsg("");
  return { errorMsg, setErrorMsg, clearErrorMsg };
}
