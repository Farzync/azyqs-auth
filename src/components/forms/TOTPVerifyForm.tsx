"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { totpVerifySchema } from "@/lib/zod/schemas/totp.schema";
import { backupCodeVerifySchema } from "@/lib/zod/schemas/backupCode.schema";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import {
  getCSRFToken,
  verifyTOTPAction,
  verifyTOTPBackupAction,
} from "@/server/auth";

interface TOTPVerifyFormProps {
  onSuccess: () => void;
  handleBackToLogin: () => void;
}

const totpFormSchema = totpVerifySchema;
const backupFormSchema = backupCodeVerifySchema;

export function TOTPVerifyForm({
  onSuccess,
  handleBackToLogin,
}: TOTPVerifyFormProps) {
  const [activeTab, setActiveTab] = useState<"totp" | "backup">("totp");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [csrfToken, setCsrfToken] = useState<string>("");

  const totpForm = useForm<z.infer<typeof totpFormSchema>>({
    resolver: zodResolver(totpFormSchema),
    defaultValues: { code: "", csrfToken: "" },
  });

  const backupForm = useForm<z.infer<typeof backupFormSchema>>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: { code: "", csrfToken: "" },
  });
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const token = await getCSRFToken();
        setCsrfToken(token);
        totpForm.setValue("csrfToken", token);
        backupForm.setValue("csrfToken", token);
      } catch {
        const error = "Failed to get CSRF token. Refresh the page.";
        setErrorMsg(error);
      }
    }
    fetchCsrfToken();
  }, [totpForm, backupForm]);

  const onSubmitTOTP = async (data: z.infer<typeof totpFormSchema>) => {
    setIsLoading(true);
    setErrorMsg("");

    if (!csrfToken) {
      const error = "CSRF token not found. Please refresh the page.";
      setErrorMsg(error);
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyTOTPAction({
        code: data.code,
        csrfToken,
      });

      if ("error" in result) {
        totpForm.setError("code", {
          type: "manual",
          message: result.error,
        });
      } else if ("success" in result && result.success) {
        onSuccess();
      }
    } catch {
      const error = "A system error has occurred. Please try again.";
      setErrorMsg(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitBackup = async (data: z.infer<typeof backupFormSchema>) => {
    setIsLoading(true);
    setErrorMsg("");

    if (!csrfToken) {
      const error = "CSRF token not found. Please refresh the page.";
      setErrorMsg(error);
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyTOTPBackupAction({
        code: data.code,
        csrfToken,
      });

      if ("error" in result) {
        backupForm.setError("code", {
          type: "manual",
          message: result.error,
        });
      } else if ("success" in result && result.success) {
        onSuccess();
      }
    } catch {
      const error = "A system error has occurred. Please try again.";
      setErrorMsg(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTOTPChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    totpForm.setValue("code", numericValue);

    if (totpForm.formState.errors.code) {
      totpForm.clearErrors("code");
    }
    if (errorMsg) setErrorMsg("");

    if (numericValue.length === 6) {
      setTimeout(() => {
        totpForm.handleSubmit(onSubmitTOTP)();
      }, 100);
    }
  };

  const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    backupForm.setValue("code", value);

    if (backupForm.formState.errors.code) {
      backupForm.clearErrors("code");
    }
    if (errorMsg) setErrorMsg("");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "totp" | "backup");
    setErrorMsg("");
    totpForm.reset({ code: "", csrfToken });
    backupForm.reset({ code: "", csrfToken });
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md select-none animate-fadeIn max-w-md mx-auto"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="relative w-full max-w-md mx-auto">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-3xl cursor-not-allowed" />
        )}

        <div className="p-8 bg-card border border-border rounded-3xl shadow-xl backdrop-blur-sm transition-all">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Two-Factor Authentication
          </h2>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="totp">Authenticator Code</TabsTrigger>
              <TabsTrigger value="backup">Backup Code</TabsTrigger>
            </TabsList>

            <TabsContent value="totp">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <form
                onSubmit={totpForm.handleSubmit(onSubmitTOTP)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="totp-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Authentication Code *
                  </Label>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={totpForm.watch("code") || ""}
                      onChange={handleTOTPChange}
                      disabled={isLoading}
                      autoFocus
                      pattern="[0-9]*"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={0}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            totpForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={1}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            totpForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={2}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            totpForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={3}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            totpForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={4}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            totpForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={5}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            totpForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {totpForm.formState.errors.code && (
                    <p className="text-xs text-destructive flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {totpForm.formState.errors.code.message}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Code will be submitted automatically when 6 digits are
                    entered
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    (totpForm.watch("code")?.length || 0) < 6 ||
                    !csrfToken
                  }
                  className="w-full flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Verify Code
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="backup">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter one of your backup codes (8 characters: letters,
                  numbers, and symbols). Backup codes can only be used once.
                </p>
              </div>

              <form
                onSubmit={backupForm.handleSubmit(onSubmitBackup)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="backup-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Backup Code *
                  </Label>

                  <Input
                    id="backup-input"
                    type="text"
                    placeholder="Enter 8-character backup code (A-Z, 0-9)"
                    value={backupForm.watch("code") || ""}
                    onChange={handleBackupCodeChange}
                    disabled={isLoading}
                    maxLength={8}
                    className={`font-mono ${
                      backupForm.formState.errors.code
                        ? "border-destructive"
                        : ""
                    }`}
                    autoFocus
                    autoComplete="off"
                  />

                  {backupForm.formState.errors.code && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {backupForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    (backupForm.watch("code")?.length || 0) !== 8 ||
                    !csrfToken
                  }
                  className="w-full flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Verify Code
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={handleBackToLogin}
            disabled={isLoading}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
