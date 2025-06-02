import { z } from "zod";
import { validationConfig } from "@/lib/zod/validationConfig";

export const backupCodeVerifySchema = z.object({
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

export type BackupCodeVerifySchema = z.infer<typeof backupCodeVerifySchema>;
