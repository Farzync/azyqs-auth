import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const registerSchema = z.object({
  name: z.string().trim().min(1, validationConfig.name.requiredMsg),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(validationConfig.username.minLength)
    .max(validationConfig.username.maxLength)
    .regex(validationConfig.username.regex, validationConfig.username.errorMsg),

  email: z.string().trim().email(validationConfig.email.invalidMsg),

  password: z
    .string()
    .trim()
    .min(validationConfig.password.minLength)
    .regex(validationConfig.password.regex, validationConfig.password.errorMsg),

  recaptchaToken: z.string().min(1, validationConfig.recaptcha.requiredMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
