"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteAccountSchema } from "@/lib/zod/schemas/deleteAccount.schema";
import { z } from "zod";
import { deleteAccountAction } from "@/server/user";
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
  TriangleAlert,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getCSRFToken } from "@/server/auth";
import toast from "react-hot-toast";

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export function DeleteAccountDialog() {
  const [open, setOpen] = React.useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    setValue,
  } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
    },
  });

  const watchedValues = watch();
  const hasContent = watchedValues.password;

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

  const onSubmit = async (data: DeleteAccountFormValues) => {
    setErrorMsg("");
    setIsLoading(true);

    if (!csrfToken) {
      setErrorMsg("CSRF token not found. Please close and reopen the dialog.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await deleteAccountAction({
        ...data,
        csrfToken,
      });

      if (result?.error) {
        if (
          result.error.toLowerCase().includes("password") ||
          result.error.toLowerCase().includes("incorrect")
        ) {
          setError("password", {
            type: "manual",
            message: result.error,
          });
        } else {
          setErrorMsg(result.error);
        }
      } else {
        toast.success("Account deleted successfully. Redirecting...");
        window.location.href = "/";
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full flex items-center gap-2 justify-center"
        >
          <TriangleAlert className="h-4 w-4" />
          Delete Account
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Confirm Delete your Account
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your password to permanently delete your account.
            <strong className="text-destructive">
              {" "}
              This action cannot be undone.
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
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Input your password"
                {...register("password")}
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !hasContent || !csrfToken}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting your Account...
                </>
              ) : (
                <>
                  <TriangleAlert className="h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
