import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const totpVerifySchema = z.object({
  code: z
    .string()
    .min(validationConfig.totp.length, validationConfig.totp.invalidMsg)
    .max(validationConfig.totp.length, validationConfig.totp.invalidMsg)
    .regex(/^\d{6}$/, validationConfig.totp.numberMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export const totpSetupSchema = z.object({
  code: z
    .string()
    .min(validationConfig.totp.length, validationConfig.totp.invalidMsg)
    .max(validationConfig.totp.length, validationConfig.totp.invalidMsg)
    .regex(/^\d{6}$/, validationConfig.totp.numberMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export const totpDisableSchema = z.object({
  password: z.string().min(1, validationConfig.password.requiredMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});
