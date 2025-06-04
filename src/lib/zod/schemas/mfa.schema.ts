import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const mfaVerifySchema = z.object({
  code: z
    .string()
    .min(validationConfig.mfa.length, validationConfig.mfa.invalidMsg)
    .max(validationConfig.mfa.length, validationConfig.mfa.invalidMsg)
    .regex(/^\d{6}$/, validationConfig.mfa.numberMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export const mfaSetupSchema = z.object({
  code: z
    .string()
    .min(validationConfig.mfa.length, validationConfig.mfa.invalidMsg)
    .max(validationConfig.mfa.length, validationConfig.mfa.invalidMsg)
    .regex(/^\d{6}$/, validationConfig.mfa.numberMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export const mfaDisableSchema = z.object({
  password: z.string().min(1, validationConfig.password.requiredMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export const mfaBackupCodeVerifySchema = z.object({
  code: z
    .string()
    .min(
      validationConfig.backupCode.length,
      validationConfig.backupCode.invalidMsg
    )
    .max(
      validationConfig.backupCode.length,
      validationConfig.backupCode.invalidMsg
    )
    .regex(
      validationConfig.backupCode.regex,
      validationConfig.backupCode.invalidMsg
    ),

  csrfToken: z.string(),
});

export type MfaBackupCodeVerifySchema = z.infer<
  typeof mfaBackupCodeVerifySchema
>;
export type MfaVerifySchema = z.infer<typeof mfaVerifySchema>;
export type MfaSetupSchema = z.infer<typeof mfaSetupSchema>;
export type MfaDisableSchema = z.infer<typeof mfaDisableSchema>;
