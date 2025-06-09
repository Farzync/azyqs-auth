"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { mfaSetupSchema } from "@/lib/zod/schemas/mfa.schema";
import Image from "next/image";
import {
  AlertCircle,
  Loader2,
  Shield,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";
import { enableMFAAction, getCSRFToken, setupMFAAction } from "@/server/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadBackupCodes } from "@/utils/backupCodes";

interface MFASecuritySetupDialogProps {
  onSuccess: () => void;
}

type MFASecurityFormValues = z.infer<typeof mfaSetupSchema>;

export function MFASecuritySetupDialog({
  onSuccess,
}: MFASecuritySetupDialogProps) {
  const { user, isLoading: userLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"setup" | "verify" | "backup-codes">(
    "setup"
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [otpValue, setOtpValue] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
    clearErrors,
  } = useForm<MFASecurityFormValues>({
    resolver: zodResolver(mfaSetupSchema),
    defaultValues: {
      code: "",
    },
  });

  // Consider "locked" if not on initial setup step
  const isProcessActive = isLoading || step !== "setup";

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

  useEffect(() => {
    async function fetchCsrfToken() {
      if (isOpen) {
        try {
          const token = await getCSRFToken();
          setCsrfToken(token);
          setValue("csrfToken", token);
        } catch {
          setErrorMsg("Failed to get CSRF token. Please try again.");
        }
      }
    }
    fetchCsrfToken();
  }, [isOpen, setValue]);

  const handleSetup = async () => {
    setStep("verify"); // langsung ke verify
    setIsLoading(true);
    setErrorMsg("");
    setQrCode(null);
    setManualEntry(null);
    try {
      const result = await setupMFAAction();
      if ("error" in result) {
        setErrorMsg(result.error);
      } else if ("success" in result && result.success) {
        setQrCode(result.qrCode);
        setManualEntry(result.manualEntry);
        toast.success("MFA setup initiated. Please verify your code.");
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MFASecurityFormValues) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await enableMFAAction(data);
      if (Object.prototype.hasOwnProperty.call(result, "error")) {
        const error = (result as { error: string }).error;
        if (
          error.toLowerCase().includes("code") ||
          error.toLowerCase().includes("invalid") ||
          error.toLowerCase().includes("incorrect")
        ) {
          setError("code", {
            type: "manual",
            message: error,
          });
        } else {
          setErrorMsg(error);
        }
      } else if (
        Object.prototype.hasOwnProperty.call(result, "success") &&
        (result as { success: boolean }).success
      ) {
        setBackupCodes((result as { backupCodes: string[] }).backupCodes || []);
        setStep("backup-codes");
        toast.success("MFA code verified. Save your backup codes!");
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setStep("setup");
    setQrCode(null);
    setManualEntry(null);
    setErrorMsg("");
    setOtpValue("");
    setCopied(false);
    reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isProcessActive) return;
    setIsOpen(nextOpen);
    if (!nextOpen) {
      resetAll();
    }
  };

  const handleCancelOrClose = () => {
    if (isProcessActive) {
      setIsOpen(false);
      resetAll();
      toast.error("MFA setup cancelled by user.");
      return;
    }
    setIsOpen(false);
    resetAll();
  };

  const handleOTPChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");

    setOtpValue(numericValue);
    setValue("code", numericValue);

    if (errors.code) {
      clearErrors("code");
    }
    if (errorMsg) {
      setErrorMsg("");
    }
  };

  // Ganti handler downloadBackupCodes
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
  };

  // Tambahkan kembali fungsi copyToClipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Secret key copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  useEffect(() => {
    if (otpValue.length === 6 && step === "verify") {
      const submitOTP = async () => {
        if (!csrfToken) {
          setErrorMsg(
            "CSRF token not found. Please close and reopen the dialog."
          );
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setErrorMsg("");
        try {
          const result = await enableMFAAction({ code: otpValue, csrfToken });
          if (Object.prototype.hasOwnProperty.call(result, "error")) {
            const error = (result as { error: string }).error;
            if (
              error.toLowerCase().includes("code") ||
              error.toLowerCase().includes("invalid") ||
              error.toLowerCase().includes("incorrect")
            ) {
              setError("code", {
                type: "manual",
                message: error,
              });
            } else {
              setErrorMsg(error);
            }
          } else if (
            Object.prototype.hasOwnProperty.call(result, "success") &&
            (result as { success: boolean }).success
          ) {
            setBackupCodes(
              (result as { backupCodes: string[] }).backupCodes || []
            );
            setStep("backup-codes");
          }
        } catch {
          setErrorMsg("A system error has occurred. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      submitOTP();
    }
  }, [otpValue, step, setError, csrfToken]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full flex items-center gap-2 justify-center"
        >
          <Shield className="h-4 w-4" />
          Enable MFA
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Setup Multi-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add an extra layer of security to your account
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

        <div className="transition-all duration-300 ease-in-out">
          {step === "setup" && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-left-4 duration-300">
              <p className="text-sm text-muted-foreground">
                Install an authenticator app like Google Authenticator, Authy,
                or 1Password, then click the button below to generate your QR
                code.
              </p>

              <Button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full flex items-center gap-2"
                type="button"
              >
                <Shield className="h-4 w-4" />
                Start Setup
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <Tabs defaultValue="qr" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="qr"
                    className="transition-all duration-200"
                  >
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="transition-all duration-200"
                  >
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="qr"
                  className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-200"
                >
                  <div className="flex justify-center">
                    {qrCode ? (
                      <Image
                        src={qrCode}
                        alt="MFA QR Code"
                        width={192}
                        height={192}
                        className="w-48 h-48 animate-in fade-in-0 zoom-in-95 duration-300"
                      />
                    ) : (
                      <Skeleton className="w-48 h-48 rounded-lg" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan this QR code with your authenticator app
                  </p>
                </TabsContent>

                <TabsContent
                  value="manual"
                  className="space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-200"
                >
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">
                      Secret Key
                    </Label>
                    <div className="relative">
                      {manualEntry ? (
                        <>
                          <Input
                            value={manualEntry}
                            readOnly
                            className="font-mono text-sm pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => copyToClipboard(manualEntry)}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Skeleton className="h-10 w-full rounded-md" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter this secret key manually in your authenticator app
                  </p>
                </TabsContent>
              </Tabs>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(onSubmit)(e);
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="otp-input"
                    className="text-sm font-medium text-foreground justify-center"
                  >
                    Enter the 6-digit code from your MFA app *
                  </Label>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={handleOTPChange}
                      disabled={isLoading}
                      pattern="[0-9]*"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={0}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            errors.code ? "border-destructive" : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={1}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            errors.code ? "border-destructive" : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={2}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            errors.code ? "border-destructive" : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={3}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            errors.code ? "border-destructive" : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={4}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            errors.code ? "border-destructive" : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={5}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            errors.code ? "border-destructive" : ""
                          }`}
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {errors.code?.message && (
                    <p className="text-xs text-destructive flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.code.message}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    MFA wil not be enabled until you enter the code from your
                    authenticator app. Please ensure your device is synchronized
                    with the correct time.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelOrClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || otpValue.length !== 6}
                    className="flex-1 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enabling...
                      </>
                    ) : (
                      "Enable MFA"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === "backup-codes" && backupCodes.length > 0 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <p className="text-sm text-muted-foreground text-center">
                Please save these backup codes in a safe place. Each code can
                only be used once if you lose access to your MFA app.
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
                    className="font-mono text-base text-center bg-card rounded px-2 py-1 border border-border text-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                    style={{ animationDelay: `${idx * 50}ms` }}
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
                    Download Backup Codes
                  </>
                )}
              </Button>

              <Button
                className="w-full mt-2"
                onClick={() => {
                  setIsOpen(false);
                  onSuccess();
                  resetAll();
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
