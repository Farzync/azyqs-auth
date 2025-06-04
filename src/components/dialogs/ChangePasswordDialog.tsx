"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/zod/schemas/changePassword.schema";
import { z } from "zod";
import { changePasswordAction } from "@/server/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Loader2,
  Key,
} from "lucide-react";
import { getCSRFToken } from "@/server/auth";
import toast from "react-hot-toast";

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordDialog() {
  const [open, setOpen] = React.useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    setValue,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const watchedValues = watch();
  const hasContent = watchedValues.currentPassword || watchedValues.newPassword;

  useEffect(() => {
    async function fetchCsrfToken() {
      if (open) {
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
  }, [open, setValue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isLoading && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [isLoading]);

  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading) return;
    if (!newOpen) {
      reset();
      setErrorMsg("");
      setCsrfToken("");
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setErrorMsg("");
    setIsLoading(true);

    if (!csrfToken) {
      setErrorMsg("CSRF token not found. Please close and reopen the dialog.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await changePasswordAction({
        ...data,
        csrfToken,
      });

      if (result?.error) {
        if (
          result.error.toLowerCase().includes("current password") ||
          result.error.toLowerCase().includes("incorrect")
        ) {
          setError("currentPassword", {
            type: "manual",
            message: result.error,
          });
        } else if (result.error.toLowerCase().includes("new password")) {
          setError("newPassword", {
            type: "manual",
            message: result.error,
          });
        } else {
          setErrorMsg(result.error);
        }
      } else {
        toast.success("Password changed successfully!");
        reset();
        setOpen(false);
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center"
        >
          <Key className="h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your old password and your new password. Make sure the new
            password is secure and easy to remember.
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="currentPassword"
              className="text-sm font-medium flex items-center gap-1 text-foreground"
            >
              <Lock className="h-4 w-4" />
              Current Password *
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Input your Current Password"
                {...register("currentPassword")}
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
                className={`pr-10 ${isLoading ? "animate-pulse" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleCurrentPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.currentPassword?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium flex items-center gap-1 text-foreground"
            >
              <Key className="h-4 w-4" />
              New Password *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Input your New Password"
                {...register("newPassword")}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                className={`pr-10 ${isLoading ? "animate-pulse" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.newPassword?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hasContent || !csrfToken}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
