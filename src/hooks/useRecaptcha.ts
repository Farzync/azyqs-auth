/**
 * Custom React hook for integrating Google reCAPTCHA v2 with theme (dark/light) support.
 *
 * This hook manages the reCAPTCHA token, handles theme changes (auto-resetting the widget if the theme changes),
 * and provides utility functions for handling reCAPTCHA events and validation state.
 *
 * @param {Object} options - Options for configuring the hook.
 * @param {string} options.siteKey - The site key for Google reCAPTCHA v2.
 * @param {(token: string | null) => void} [options.onTokenChange] - Optional callback invoked when the reCAPTCHA token changes.
 * @param {boolean} [options.resetOnThemeChange=true] - Whether to reset the reCAPTCHA widget when the theme changes.
 * @returns {Object} Hook return values and handlers.
 * @returns {React.RefObject<ReCAPTCHA | null>} recaptchaRef - Ref to be attached to the <ReCAPTCHA> component.
 * @returns {string} recaptchaToken - The current reCAPTCHA token value.
 * @returns {boolean} isDarkMode - Whether the current theme is dark mode.
 * @returns {(token: string | null) => void} handleRecaptchaChange - Handler for reCAPTCHA token changes.
 * @returns {() => void} resetRecaptcha - Function to manually reset the reCAPTCHA widget.
 * @returns {boolean} isRecaptchaValid - Whether the reCAPTCHA token is valid and present.
 *
 * @example
 * const {
 *   recaptchaRef,
 *   recaptchaToken,
 *   isDarkMode,
 *   handleRecaptchaChange,
 *   resetRecaptcha,
 *   isRecaptchaValid
 * } = useRecaptcha({ siteKey: 'your-site-key', onTokenChange: handleToken });
 */
import { useState, useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface UseRecaptchaOptions {
  siteKey: string;
  onTokenChange?: (token: string | null) => void;
  resetOnThemeChange?: boolean;
}

interface UseRecaptchaReturn {
  recaptchaRef: React.RefObject<ReCAPTCHA | null>;
  recaptchaToken: string;
  isDarkMode: boolean;
  handleRecaptchaChange: (token: string | null) => void;
  resetRecaptcha: () => void;
  isRecaptchaValid: boolean;
}

export function useRecaptcha({
  siteKey,
  onTokenChange,
  resetOnThemeChange = true,
}: UseRecaptchaOptions): UseRecaptchaReturn {
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            const isDark = document.documentElement.classList.contains("dark");
            setIsDarkMode(isDark);

            if (resetOnThemeChange && recaptchaRef.current) {
              recaptchaRef.current.reset();
              setRecaptchaToken("");
              onTokenChange?.("");
            }
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    }
  }, [resetOnThemeChange, onTokenChange]);

  const handleRecaptchaChange = (token: string | null) => {
    const tokenValue = token || "";
    setRecaptchaToken(tokenValue);
    onTokenChange?.(token);
  };

  const resetRecaptcha = () => {
    recaptchaRef.current?.reset();
    setRecaptchaToken("");
    onTokenChange?.("");
  };

  const isRecaptchaValid = Boolean(recaptchaToken && siteKey);

  return {
    recaptchaRef,
    recaptchaToken,
    isDarkMode,
    handleRecaptchaChange,
    resetRecaptcha,
    isRecaptchaValid,
  };
}
