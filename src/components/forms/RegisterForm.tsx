"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/zod/schemas/register.schema";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Loader2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getCSRFToken, registerAction } from "@/server/auth";
import { usePasskeyLogin } from "@/hooks/usePasskeyLogin";
import { PasskeyLoginButton } from "@/components/forms/PasskeyLoginButton";
import { useAuth } from "@/contexts/auth-context";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { RecaptchaField } from "@/components/forms/RecaptchaField";

type RegisterFormValues = z.infer<typeof registerSchema>;

function ErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md mb-4 select-none animate-fadeIn"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    isPasskeyLoading,
    errorMsg: passkeyError,
    handlePasskeyLogin,
  } = usePasskeyLogin(setUser);

  const {
    recaptchaRef,
    recaptchaToken,
    isDarkMode,
    handleRecaptchaChange,
    resetRecaptcha,
  } = useRecaptcha({
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
    onTokenChange: (token) => {
      setValue("recaptchaToken", token || "", { shouldValidate: true });
      if (token) {
        clearErrors("recaptchaToken");
      }
    },
    resetOnThemeChange: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    setError: setFormError,
    clearErrors,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      recaptchaToken: "",
      csrfToken: "",
    },
  });

  const watchedFields = watch();

  useEffect(() => {
    const hasRequiredFields =
      watchedFields.username &&
      watchedFields.name &&
      watchedFields.email &&
      watchedFields.password &&
      recaptchaToken &&
      csrfToken;

    const hasNoErrors = Object.keys(errors).length === 0;

    setIsFormValid(Boolean(hasRequiredFields && hasNoErrors && isValid));
  }, [watchedFields, errors, isValid, recaptchaToken, csrfToken]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const token = await getCSRFToken();
        setCsrfToken(token);
        setValue("csrfToken", token, { shouldValidate: true });
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
        setError("Failed to get CSRF token. Please refresh the page.");
      }
    };

    fetchCsrfToken();
  }, [setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setError("");
    setIsLoading(true);

    if (!csrfToken) {
      setError("CSRF token not found. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    if (!recaptchaToken) {
      setFormError("recaptchaToken", {
        type: "manual",
        message: "Please complete the reCAPTCHA verification",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerAction({
        ...data,
        recaptchaToken,
        csrfToken,
      });

      if (result?.error) {
        setError(result.error);
        resetRecaptcha();
      } else {
        toast.success("Registration successful! Redirecting to login...");
        router.push("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred. Please try again.");
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-full sm:max-w-md mx-auto p-4 sm:p-6 md:p-8 rounded-3xl bg-card border border-border shadow-xl backdrop-blur-sm transition-all relative"
      >
        {(isLoading || isPasskeyLoading) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-3xl cursor-not-allowed" />
        )}
        <input type="hidden" {...register("csrfToken")} value={csrfToken} />
        <input
          type="hidden"
          {...register("recaptchaToken")}
          value={recaptchaToken}
        />

        <div className="text-center mb-6 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Create New Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Fill in the form below to create a new account.
          </p>
        </div>

        <ErrorAlert message={passkeyError || error} />

        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Input your username"
                autoComplete="username"
                aria-invalid={!!errors.username}
                {...register("username")}
                className={`pl-10 ${
                  isLoading || isPasskeyLoading ? "animate-pulse" : ""
                }`}
                disabled={isLoading || isPasskeyLoading}
                onChange={(e) =>
                  setValue("username", e.target.value.toLowerCase(), {
                    shouldValidate: true,
                  })
                }
                value={(watch("username") || "").toLowerCase()}
              />
            </div>
            {errors.username?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Input your full name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register("name")}
                className={`pl-10 ${
                  isLoading || isPasskeyLoading ? "animate-pulse" : ""
                }`}
                disabled={isLoading || isPasskeyLoading}
              />
            </div>
            {errors.name?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Input your email address"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={`pl-10 ${
                  isLoading || isPasskeyLoading ? "animate-pulse" : ""
                }`}
                disabled={isLoading || isPasskeyLoading}
              />
            </div>
            {errors.email?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Input your password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
                className={`pl-10 pr-10 ${
                  isLoading || isPasskeyLoading ? "animate-pulse" : ""
                }`}
                disabled={isLoading || isPasskeyLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                tabIndex={-1}
                disabled={isLoading || isPasskeyLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
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

          <RecaptchaField
            recaptchaRef={recaptchaRef}
            siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
            onChange={handleRecaptchaChange}
            theme={isDarkMode ? "dark" : "light"}
            size="normal"
            disabled={isLoading || isPasskeyLoading}
            error={errors.recaptchaToken?.message}
          />

          <div className="flex flex-col gap-2 items-center justify-center">
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </>
              )}
            </Button>

            <PasskeyLoginButton
              onClick={handlePasskeyLogin}
              disabled={isLoading || isPasskeyLoading}
              loading={isPasskeyLoading}
            />

            <p className="text-sm text-center text-muted-foreground mt-4">
              Already Have an Account?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline underline-offset-4"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
