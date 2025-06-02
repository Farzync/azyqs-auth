import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const loginSchema = z.object({
  username: z.string().trim().min(1, validationConfig.username.requiredMsg),
  password: z.string().min(1, validationConfig.password.requiredMsg),
  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
  recaptchaToken: z.string().min(1, validationConfig.recaptcha.requiredMsg),
});

export type LoginSchema = z.infer<typeof loginSchema>;
