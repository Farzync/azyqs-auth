"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { regenerateBackupCodesAction } from "@/server/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, RefreshCcw, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { downloadBackupCodes } from "@/utils/backupCodes";

type RegenerateBackupCodesResult = {
  success?: boolean;
  error?: string;
  backupCodes?: string[];
};

export function RegenerateBackupCodesDialog({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { user, isLoading: userLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccess(false);
    try {
      const result: RegenerateBackupCodesResult =
        await regenerateBackupCodesAction();
      if (result.error) {
        setErrorMsg(result.error);
      } else if (result.success) {
        if (
          Array.isArray(result.backupCodes) &&
          result.backupCodes.every((c: string) => typeof c === "string")
        ) {
          setBackupCodes(result.backupCodes);
          setSuccess(true);
          toast.success("New backup codes generated successfully!");
        } else {
          setErrorMsg("Failed to get backup codes. Please try again.");
          setBackupCodes([]);
          setSuccess(false);
        }
      }
    } catch {
      setErrorMsg("A system error has occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    downloadBackupCodes({
      codes: backupCodes,
      user: user
        ? {
            name: user.name,
            username: user.username,
            email: user.email,
          }
        : undefined,
      filenamePrefix: "backup-codes",
    });
    toast.success("Backup codes downloaded successfully!");
  };

  const isProcessActive = isLoading || success;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isProcessActive && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [isProcessActive]);

  const handleOpenChange = (open: boolean) => {
    if (isProcessActive) return;
    setIsOpen(open);
    if (!open) {
      setBackupCodes([]);
      setErrorMsg("");
      setSuccess(false);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center"
        >
          <RefreshCcw className="h-4 w-4" />
          Regenerate MFA Backup Codes
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <RefreshCcw className="h-5 w-5" />
            Create New MFA Backup Codes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This will generate a new set of MFA backup codes. Old codes will be
            invalidated.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md mb-4 select-none animate-fadeIn"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {!success && (
          <Button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="w-full mt-2"
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate Codes"
            )}
          </Button>
        )}

        {success && backupCodes.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please save these backup codes in a safe place. Each code can only
              be used once if you lose access to the authenticator app.
              <br />
              <span className="font-semibold text-destructive">
                Don&apos;t share the code with anyone!{" "}
              </span>
              <br />
              <span className="text-xs text-muted-foreground">
                Format: 8 uppercase letters or numbers (A-Z, 0-9)
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2 bg-muted/50 border border-border rounded-md p-4 justify-center">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="font-mono text-base text-center bg-card rounded px-2 py-1 border border-border text-foreground"
                >
                  {idx + 1}. {code.replace(/[^A-Z0-9]/g, "")}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadBackupCodes}
              className="w-full flex items-center gap-2"
              disabled={userLoading}
            >
              {userLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download MFA Backup Codes
                </>
              )}
            </Button>

            <Button
              className="w-full mt-2"
              onClick={() => {
                setIsOpen(false);
                setBackupCodes([]);
                setSuccess(false);
                setErrorMsg("");
                setIsLoading(false);
                if (onSuccess) onSuccess();
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
