"use client";

import { Button } from "@/components/ui/button";
import { KeyRound, Loader2 } from "lucide-react";

interface PasskeyLoginButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export function PasskeyLoginButton({
  onClick,
  disabled = false,
  loading = false,
}: PasskeyLoginButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2 mt-2"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking passkey...
        </>
      ) : (
        <>
          <KeyRound className="h-5 w-5" />
          Login with Passkey
        </>
      )}
    </Button>
  );
}
