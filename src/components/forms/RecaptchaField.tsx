import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { AlertCircle } from "lucide-react";

interface RecaptchaFieldProps {
  recaptchaRef: React.RefObject<ReCAPTCHA | null>;
  siteKey: string;
  onChange: (token: string | null) => void;
  theme?: "light" | "dark";
  size?: "compact" | "normal";
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function RecaptchaField({
  recaptchaRef,
  siteKey,
  onChange,
  theme = "light",
  size = "normal",
  disabled = false,
  error,
  className = "",
}: RecaptchaFieldProps) {
  if (!siteKey) {
    console.warn("reCAPTCHA site key not provided");
    return null;
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onChange}
          theme={theme}
          size={size}
          {...(disabled
            ? { style: { pointerEvents: "none", opacity: 0.6 } }
            : {})}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 justify-center">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
