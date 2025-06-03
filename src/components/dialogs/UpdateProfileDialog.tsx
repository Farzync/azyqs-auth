"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@/lib/zod/schemas/updateProfile.schema";
import { z } from "zod";
import { updateProfileAction } from "@/server/user";
import { User } from "@/types/user";
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
  Edit,
  User as UserIcon,
  Mail,
  AlertCircle,
  Check,
  Loader2,
  AtSign,
} from "lucide-react";
import { getCSRFToken } from "@/server/auth";
import toast from "react-hot-toast";

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

interface ProfileEditDialogProps {
  user: User;
  onUserUpdate?: (updatedUser: User) => void;
  children?: React.ReactNode;
}

export function UpdateProfileDialog({
  user,
  onUserUpdate,
  children,
}: ProfileEditDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    setValue,
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      username: user.username,
    },
  });

  const watchedValues = watch();
  const hasChanges =
    watchedValues.name !== user.name ||
    watchedValues.email !== user.email ||
    watchedValues.username !== user.username;

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({
        name: user.name,
        email: user.email,
        username: user.username,
      });
      setErrorMsg("");
      setCsrfToken("");
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: UpdateProfileFormValues) => {
    setErrorMsg("");
    setIsLoading(true);

    if (!csrfToken) {
      setErrorMsg("CSRF token not found. Please close and reopen the dialog.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateProfileAction({
        ...data,
        csrfToken,
      });

      if (result?.error) {
        if (
          result.error.toLowerCase().includes("email") &&
          result.error.toLowerCase().includes("already") &&
          result.error.toLowerCase().includes("used")
        ) {
          setError("email", {
            type: "manual",
            message: result.error,
          });
        } else if (
          result.error.toLowerCase().includes("username") &&
          result.error.toLowerCase().includes("already") &&
          result.error.toLowerCase().includes("used")
        ) {
          setError("username", {
            type: "manual",
            message: result.error,
          });
        } else {
          setErrorMsg(result.error);
        }
      } else if (
        "success" in result &&
        result.success &&
        "data" in result &&
        result.data
      ) {
        if (onUserUpdate) {
          onUserUpdate(result.data);
        }
        toast.success("Profile updated successfully!");
        setOpen(false);
        reset({
          name: result.data.name,
          email: result.data.email,
          username: result.data.username,
        });
      }
    } catch {
      const errorMessage = "A system error has occurred. Please try again.";
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 justify-center"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserIcon className="h-5 w-5" />
            Edit your Profile
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Change your name and email information. Make sure the email used is
            still active.
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
          <input type="hidden" {...register("csrfToken")} value={csrfToken} />
          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="text-sm font-medium flex items-center gap-1 text-foreground"
            >
              <AtSign className="h-4 w-4" />
              Username *
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Input your username"
              {...register("username")}
              aria-invalid={!!errors.username}
              className={isLoading ? "animate-pulse" : ""}
              disabled={isLoading}
              autoComplete="off"
              onChange={(e) =>
                setValue("username", e.target.value.toLowerCase(), {
                  shouldValidate: true,
                })
              }
              value={(watch("username") || "").toLowerCase()}
            />
            {errors.username?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-sm font-medium flex items-center gap-1 text-foreground"
            >
              <UserIcon className="h-4 w-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Input your full name"
              {...register("name")}
              aria-invalid={!!errors.name}
              className={isLoading ? "animate-pulse" : ""}
              disabled={isLoading}
            />
            {errors.name?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium flex items-center gap-1 text-foreground"
            >
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Input your email address"
              {...register("email")}
              aria-invalid={!!errors.email}
              className={isLoading ? "animate-pulse" : ""}
              disabled={isLoading}
            />
            {errors.email?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
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
              disabled={isLoading || !hasChanges || !csrfToken}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
