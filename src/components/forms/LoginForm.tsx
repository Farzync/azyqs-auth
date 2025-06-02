"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/zod/schemas/login.schema";
import { loginAction, getCSRFToken } from "@/server/auth";
import { getProfile } from "@/server/user";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { TOTPVerifyForm } from "@/components/forms/TOTPVerifyForm";
import toast from "react-hot-toast";
import { usePasskeyLogin } from "@/hooks/usePasskeyLogin";
import { PasskeyLoginButton } from "@/components/forms/PasskeyLoginButton";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { RecaptchaField } from "@/components/forms/RecaptchaField";

type LoginFormValues = z.infer<typeof loginSchema>;

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

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showTOTP, setShowTOTP] = useState(false);
  const [loginData, setLoginData] = useState<LoginFormValues | null>(null);

  const {
    isPasskeyLoading,
    errorMsg: passkeyError,
    handlePasskeyLogin,
  } = usePasskeyLogin(setUser);

  const loginViaTOTP = useRef(false);

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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
      recaptchaToken: "",
      csrfToken: "",
    },
  });

  const watchedFields = watch();

  useEffect(() => {
    const hasRequiredFields =
      watchedFields.username &&
      watchedFields.password &&
      recaptchaToken &&
      csrfToken;

    const hasNoErrors = Object.keys(errors).length === 0;

    setIsFormValid(Boolean(hasRequiredFields && hasNoErrors && isValid));
  }, [watchedFields, errors, isValid, recaptchaToken, csrfToken]);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const token = await getCSRFToken();
        setCsrfToken(token);
        setValue("csrfToken", token, { shouldValidate: true });
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
        setErrorMsg("Failed to get CSRF token. Please refresh the page.");
      }
    };

    fetchCsrfToken();
  }, [setValue]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg("");
    setIsLoading(true);

    if (!csrfToken) {
      setErrorMsg("CSRF token not found. Please refresh the page.");
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
      const result = await loginAction({
        ...data,
        csrfToken,
        recaptchaToken,
      });

      if (result?.error) {
        resetRecaptcha();

        if (result.error.includes("Invalid credentials")) {
          setErrorMsg("Invalid username or password");
        } else {
          setErrorMsg(result.error);
        }
      } else if ("totp_required" in result && result.totp_required) {
        setShowTOTP(true);
        setLoginData(data);
        toast.success("Two-factor authentication required");
      } else {
        try {
          const userProfile = await getProfile();
          setUser(userProfile);

          if (!loginViaTOTP.current) {
            toast.success("Login successful!");
          }

          setTimeout(() => {
            router.push("/");
          }, 1000);
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          setErrorMsg("Failed to load user profile. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("An unexpected error occurred. Please try again.");
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTOTPVerifySuccess = async () => {
    loginViaTOTP.current = true;
    try {
      const userProfile = await getProfile();
      setUser(userProfile);
      toast.success("Login successful!");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Profile fetch error after TOTP:", error);
      setErrorMsg("Failed to load user profile after verification.");
    }
  };

  const handleBackToLogin = () => {
    setShowTOTP(false);
    setLoginData(null);
    loginViaTOTP.current = false;
    resetRecaptcha();
    setErrorMsg("");
  };

  if (showTOTP && loginData) {
    return (
      <TOTPVerifyForm
        handleBackToLogin={handleBackToLogin}
        onSuccess={handleTOTPVerifySuccess}
      />
    );
  }

  return (
    <div className="w-full max-w-full sm:max-w-md mx-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative p-4 sm:p-6 md:p-8 rounded-3xl bg-card border border-border shadow-xl backdrop-blur-sm transition-all"
      >
        <input type="hidden" {...register("csrfToken")} value={csrfToken} />
        <input
          type="hidden"
          {...register("recaptchaToken")}
          value={recaptchaToken}
        />

        {(isLoading || isPasskeyLoading) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-3xl cursor-not-allowed pointer-events-none" />
        )}

        <div className="text-center mb-6 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome Back!
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your account
          </p>
        </div>

        <ErrorAlert message={passkeyError || errorMsg} />

        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Input your password"
                autoComplete="current-password"
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
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading || isPasskeyLoading}
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
        </div>

        <div className="mt-6 flex flex-col gap-2 items-center justify-center">
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </>
            )}
          </Button>

          <PasskeyLoginButton
            onClick={handlePasskeyLogin}
            disabled={isLoading || isPasskeyLoading}
            loading={isPasskeyLoading}
          />

          <p className="text-sm text-center text-muted-foreground mt-4">
            Don&apos;t Have an Account?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
