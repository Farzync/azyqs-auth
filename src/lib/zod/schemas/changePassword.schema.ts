import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, validationConfig.password.currentRequiredMsg),
  newPassword: z
    .string()
    .min(validationConfig.password.minLength)
    .regex(validationConfig.password.regex, validationConfig.password.errorMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
