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
import { totpSetupSchema } from "@/lib/zod/schemas/totp.schema";
import Image from "next/image";
import { AlertCircle, Loader2, Shield, Download } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";
import { enableTOTPAction, getCSRFToken, setupTOTPAction } from "@/server/auth";

interface TOTPSetupDialogProps {
  onSuccess: () => void;
}

type TOTPFormValues = z.infer<typeof totpSetupSchema>;

export function TOTPSetupDialog({ onSuccess }: TOTPSetupDialogProps) {
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

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
    clearErrors,
  } = useForm<TOTPFormValues>({
    resolver: zodResolver(totpSetupSchema),
    defaultValues: {
      code: "",
    },
  });

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
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await setupTOTPAction();
      if ("error" in result) {
        setErrorMsg(result.error);
      } else if ("success" in result && result.success) {
        setQrCode(result.qrCode);
        setManualEntry(result.manualEntry);
        setStep("verify");
        toast.success("2FA setup initiated. Please verify your code.");
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TOTPFormValues) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await enableTOTPAction(data);
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
        toast.success("2FA code verified. Save your backup codes!");
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
    reset();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetAll();
    }
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

    let content = `${user?.username} - Backup Codes\n`;
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
      user?.username.toLowerCase() ?? "your-2fa"
    }-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
          const result = await enableTOTPAction({ code: otpValue, csrfToken });
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
          Enable 2FA
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Setup Two-Factor Authentication
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

        {step === "setup" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Install an authenticator app like Google Authenticator, Authy, or
              1Password, then click the button below to generate your QR code.
            </p>

            <Button
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full flex items-center gap-2"
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate QR Code"
              )}
            </Button>
          </div>
        )}

        {step === "verify" && qrCode && manualEntry && (
          <div className="space-y-4">
            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                <div className="flex justify-center">
                  <Image
                    src={qrCode}
                    alt="TOTP QR Code"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app
                </p>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Secret Key
                  </Label>
                  <Input
                    value={manualEntry}
                    readOnly
                    className="font-mono text-sm"
                  />
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
                  className="text-sm font-medium text-foreground"
                >
                  Enter the 6-digit code from your app *
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
                  Code will be submitted automatically when 6 digits are entered
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("setup")}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
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
                    "Enable 2FA"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === "backup-codes" && backupCodes.length > 0 && (
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
                onSuccess();
                resetAll();
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
