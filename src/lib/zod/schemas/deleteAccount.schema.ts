import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, validationConfig.password.deleteRequiredMsg),

  csrfToken: z.string().min(1, validationConfig.csrf.requiredMsg),
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
