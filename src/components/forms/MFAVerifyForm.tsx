"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  mfaBackupCodeVerifySchema,
  mfaVerifySchema,
} from "@/lib/zod/schemas/mfa.schema";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import { verifyMFAAction, verifyMFABackupAction } from "@/server/auth";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { useFormErrorHandler } from "@/hooks/useFormErrorHandler";

interface MFAVerifyFormProps {
  onSuccess: () => void;
  handleBackToLogin: () => void;
}

const mfaFormSchema = mfaVerifySchema;
const backupFormSchema = mfaBackupCodeVerifySchema;

export function MFAVerifyForm({
  onSuccess,
  handleBackToLogin,
}: MFAVerifyFormProps) {
  const [activeTab, setActiveTab] = useState<"totp" | "backup">("totp");
  const [isLoading, setIsLoading] = useState(false);
  // Removed duplicate errorMsg/setErrorMsg state, handled by useFormErrorHandler
  // --- Custom Hooks ---
  const { csrfToken, csrfError } = useCsrfToken((name, value) => {
    mfaForm.setValue("csrfToken", value);
    backupForm.setValue("csrfToken", value);
  });
  // Use destructuring with unique names to avoid redeclaration issues
  const formErrorHandler = useFormErrorHandler();
  const errorMsg = formErrorHandler.errorMsg;
  const setErrorMsg = formErrorHandler.setErrorMsg;
  const clearErrorMsg = formErrorHandler.clearErrorMsg;

  const mfaForm = useForm<z.infer<typeof mfaFormSchema>>({
    resolver: zodResolver(mfaFormSchema),
    defaultValues: { code: "", csrfToken: "" },
  });

  const backupForm = useForm<z.infer<typeof backupFormSchema>>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: { code: "", csrfToken: "" },
  });
  // No need for manual CSRF fetch, handled by useCsrfToken

  const onSubmitMFA = async (data: z.infer<typeof mfaFormSchema>) => {
    setIsLoading(true);
    clearErrorMsg();

    if (!csrfToken) {
      setErrorMsg(
        csrfError || "CSRF token not found. Please refresh the page."
      );
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyMFAAction({
        code: data.code,
        csrfToken,
      });

      if ("error" in result) {
        mfaForm.setError("code", {
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
    clearErrorMsg();

    if (!csrfToken) {
      setErrorMsg(
        csrfError || "CSRF token not found. Please refresh the page."
      );
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyMFABackupAction({
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
    mfaForm.setValue("code", numericValue);

    if (mfaForm.formState.errors.code) {
      mfaForm.clearErrors("code");
    }
    if (errorMsg) setErrorMsg("");

    if (numericValue.length === 6) {
      setTimeout(() => {
        mfaForm.handleSubmit(onSubmitMFA)();
      }, 100);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "totp" | "backup");
    setErrorMsg("");
    mfaForm.reset({ code: "", csrfToken });
    backupForm.reset({ code: "", csrfToken });
  };

  return (
    <div className="space-y-6">
      {(errorMsg || csrfError) && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md select-none animate-fadeIn max-w-md mx-auto"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMsg || csrfError}</span>
        </div>
      )}

      <div className="relative w-full max-w-md mx-auto">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-3xl cursor-not-allowed" />
        )}

        <div className="p-8 bg-card border border-border rounded-3xl shadow-xl backdrop-blur-sm transition-all">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            Multi-Factor Authentication
          </h2>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="totp">MFA Code</TabsTrigger>
              <TabsTrigger value="backup">Backup Code</TabsTrigger>
            </TabsList>

            <TabsContent value="totp">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your MFA app.
                </p>
              </div>

              <form
                onSubmit={mfaForm.handleSubmit(onSubmitMFA)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="totp-input"
                    className="text-sm font-medium text-foreground"
                  >
                    MFA Code *
                  </Label>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={mfaForm.watch("code") || ""}
                      onChange={handleTOTPChange}
                      disabled={isLoading}
                      autoFocus
                      pattern="[0-9]*"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={0}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            mfaForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={1}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            mfaForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={2}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            mfaForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={3}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            mfaForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={4}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            mfaForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={5}
                          className={`${isLoading ? "animate-pulse" : ""} ${
                            mfaForm.formState.errors.code
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {mfaForm.formState.errors.code && (
                    <p className="text-xs text-destructive flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {mfaForm.formState.errors.code.message}
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
                    (mfaForm.watch("code")?.length || 0) < 6 ||
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
                  Enter one of your backup codes (8 characters: letters and
                  numbers). Backup codes can only be used once.
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

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={8}
                      value={backupForm.watch("code") || ""}
                      onChange={(value: string) => {
                        const formatted = value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "");
                        backupForm.setValue("code", formatted);

                        if (backupForm.formState.errors.code) {
                          backupForm.clearErrors("code");
                        }
                        if (errorMsg) setErrorMsg("");

                        if (formatted.length === 8) {
                          setTimeout(() => {
                            backupForm.handleSubmit(onSubmitBackup)();
                          }, 100);
                        }
                      }}
                      disabled={isLoading}
                      autoFocus
                      pattern="[A-Z0-9]*"
                    >
                      {[...Array(8)].map((_, idx) => (
                        <InputOTPGroup key={idx}>
                          <InputOTPSlot
                            index={idx}
                            className={`${isLoading ? "animate-pulse" : ""} ${
                              backupForm.formState.errors.code
                                ? "border-destructive"
                                : ""
                            }`}
                          />
                        </InputOTPGroup>
                      ))}
                    </InputOTP>
                  </div>

                  {backupForm.formState.errors.code && (
                    <p className="text-xs text-destructive flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {backupForm.formState.errors.code.message}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Code will be submitted automatically when 8 characters are
                    entered
                  </p>
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
