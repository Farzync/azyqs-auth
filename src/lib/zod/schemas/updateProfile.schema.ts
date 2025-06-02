import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, validationConfig.name.requiredMsg),

  email: z.string().trim().email(validationConfig.email.invalidMsg),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(validationConfig.username.minLength)
    .max(validationConfig.username.maxLength)
    .regex(validationConfig.username.regex, validationConfig.username.errorMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
