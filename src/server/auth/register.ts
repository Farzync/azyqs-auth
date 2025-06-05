"use server";

import { registerSchema } from "@/lib/zod/schemas/register.schema";
import {
  verifyRecaptcha,
  requireValidCSRFToken,
  formatError,
  logError,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bcryptHash } from "@/lib/auth/bcrypt";
import { AuditLogAction } from "@/types/auditlog";
import { createUserAuditLog } from "@/lib/auditLog";

/**
 * Register a new user account with validation, reCAPTCHA, and CSRF protection.
 *
 * @param input {unknown} - The registration data (should match registerSchema)
 * @returns {Object} Success object or error message with issues
 *
 * Side effects:
 * - Validates CSRF token
 * - Validates reCAPTCHA
 * - Checks for existing user
 * - Hashes password and creates user in database
 * - Creates audit log entry for registration attempt
 * - Logs errors on failure
 *
 * Example usage:
 * const result = await registerAction({ name, username, email, password, recaptchaToken, csrfToken });
 */
export async function registerAction(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Validation error",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, username, email, password, recaptchaToken, csrfToken } =
    parsed.data;

  const csrfError = await requireValidCSRFToken(csrfToken);
  if (csrfError) return csrfError;

  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return formatError("reCAPTCHA verification failed. Please try again.");
  }

  let userId: string | null = null;
  const timestamp = new Date();

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        await createUserAuditLog({
          userId: existingUser.id,
          action: AuditLogAction.REGISTER,
          details: `Registration attempt with existing email: ${email}`,
          success: false,
          errorMessage: "Email already exists",
          at: timestamp,
        });
      } else {
        await createUserAuditLog({
          userId: existingUser.id,
          action: AuditLogAction.REGISTER,
          details: `Registration attempt with existing username: ${username}`,
          success: false,
          errorMessage: "Username already exists",
          at: timestamp,
        });
      }

      return formatError("Email or username is already been used");
    }

    const hashedPassword = await bcryptHash(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
    });

    userId = newUser.id;

    await createUserAuditLog({
      userId,
      action: AuditLogAction.REGISTER,
      details: `User registered successfully with username: ${username}`,
      success: true,
      at: timestamp,
    });

    return { success: true };
  } catch (error) {
    logError("registerAction", error);

    if (userId) {
      try {
        await createUserAuditLog({
          userId,
          action: AuditLogAction.REGISTER,
          details: `Registration failed during user creation`,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          at: timestamp,
        });
      } catch (auditError) {
        logError("registerAction", auditError);
      }
    }

    return formatError("Registration failed");
  }
}
