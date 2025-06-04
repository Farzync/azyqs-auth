"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { totpDisableSchema } from "@/lib/zod/schemas/totp.schema";
import {
  ShieldOff,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { disableTOTPAction, getCSRFToken } from "@/server/auth";

interface TOTPDisableDialogProps {
  onSuccess: () => void;
}

type TOTPDisableFormValues = z.infer<typeof totpDisableSchema>;

export function TOTPDisableDialog({ onSuccess }: TOTPDisableDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError,
  } = useForm<TOTPDisableFormValues>({
    resolver: zodResolver(totpDisableSchema),
    defaultValues: {
      password: "",
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

  const watchedValues = watch();
  const hasContent = watchedValues.password;

  const onSubmit = async (data: TOTPDisableFormValues) => {
    if (!csrfToken) {
      setErrorMsg("CSRF token not found. Please close and reopen the dialog.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await disableTOTPAction({
        ...data,
        csrfToken,
      });

      if ("error" in result) {
        if (
          result.error.toLowerCase().includes("password") ||
          result.error.toLowerCase().includes("incorrect") ||
          result.error.toLowerCase().includes("invalid")
        ) {
          setError("password", {
            type: "manual",
            message: result.error,
          });
        } else {
          setErrorMsg(result.error);
        }
      } else if ("success" in result && result.success) {
        toast.success("Two-factor authentication has been disabled.");
        onSuccess();
        handleClose();
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMsg("");
    reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
    if (!open) {
      handleClose();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full flex items-center gap-2 justify-center"
        >
          <ShieldOff className="h-4 w-4" />
          Disable 2FA
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldOff className="h-5 w-5" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This will remove the extra security layer from your account.
            <strong className="text-destructive">
              {" "}
              Your account will be less secure.
            </strong>
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
              htmlFor="password"
              className="text-sm font-medium flex items-center gap-1 text-foreground"
            >
              <Lock className="h-4 w-4" />
              Password *
            </Label>
            <div className="relative">
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className={`pr-10 ${isLoading ? "animate-pulse" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !hasContent}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disabling 2FA...
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4" />
                  Disable 2FA
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
