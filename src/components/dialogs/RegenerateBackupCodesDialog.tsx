"use client";

import { useState } from "react";
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
          const errorMessage = "Failed to get backup codes. Please try again.";
          setErrorMsg(errorMessage);
          setBackupCodes([]);
          setSuccess(false);
        }
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    const [domainName, extension] = domain.split(".");
    const maskedUsername =
      username.length > 2
        ? username.substring(0, 2) +
          "*".repeat(Math.max(username.length - 2, 1))
        : username + "*";
    const maskedDomain =
      domainName.length > 2
        ? domainName.substring(0, 2) +
          "*".repeat(Math.max(domainName.length - 2, 1))
        : domainName.substring(0, 1) + "*";
    return `${maskedUsername}@${maskedDomain}.${extension.substring(
      0,
      1
    )}${"*".repeat(Math.max(extension.length - 1, 1))}`;
  };

  const downloadBackupCodes = () => {
    const currentDate = new Date().toLocaleDateString("id-ID");
    const currentTime = new Date().toLocaleTimeString("id-ID");
    let content = `${user?.username ?? ""} - Backup Codes\n`;
    content += `Generated on: ${currentDate} at ${currentTime}\n`;
    content += `\n`;
    if (user) {
      content += `Account Information:\n`;
      if (user.name) content += `Name: ${user.name}\n`;
      if (user.username) content += `Username: ${user.username}\n`;
      if (user.email) content += `Email: ${maskEmail(user.email)}\n`;
      content += `\n`;
    }
    content += `IMPORTANT:\n`;
    content += `- Save these codes in a safe place\n`;
    content += `- Each code can only be used once\n`;
    content += `- Use these codes if you lose access to your authenticator app\n`;
    content += `- Do not share these codes with anyone\n`;
    content += `\n`;
    content += `Backup Codes:\n`;
    content += `\n`;
    backupCodes.forEach((code, index) => {
      content += `${index + 1}. ${code}\n`;
    });
    content += `\n`;
    content += `Keep this file secure and delete it once you've saved the codes elsewhere.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      user?.username?.toLowerCase() ?? "your-2fa"
    }-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded successfully!");
  };

  const handleOpenChange = (open: boolean) => {
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
          Regenerate Backup Codes
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <RefreshCcw className="h-5 w-5" />
            Create New Backup Codes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This will generate a new set of backup codes. Old codes will be
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
              onClick={downloadBackupCodes}
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
                  Download Backup Codes
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
