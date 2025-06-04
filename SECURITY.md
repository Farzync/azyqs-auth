# Security Overview

This document explains the security model, authentication flow, and user action protections in the project.

---

## Authentication Flow

### 1. Registration

- **Validations:**
  - All fields validated with Zod schemas.
  - CSRF token and Google reCAPTCHA required.
  - Passwords are hashed with bcryptjs before storage.
- **Security:**
  - Duplicate email/username checks.
  - Audit log for all registration attempts (success/failure).

### 2. Login

- **Validations:**
  - Username/email and password validated.
  - CSRF token and reCAPTCHA required.
- **Security:**
  - Password checked with bcryptjs.
  - If MFA is enabled, user must complete TOTP or backup code verification.
  - If Passkey (WebAuthn) is enabled, user can login passwordlessly.
  - JWT session token set as httpOnly, secure cookie.
  - Audit log for all login attempts (success/failure).

### 3. Multi-Factor Authentication (MFA)

- **Setup:**
  - User generates a TOTP secret (QR code) and verifies with a code from their authenticator app.
  - Backup codes are generated and stored (hashed) for recovery.
  - Audit log for setup, enable, disable, and failed attempts.
- **Verification:**
  - TOTP code or backup code required after password login if MFA is enabled.
  - CSRF token required for all MFA actions.
  - Backup codes are one-time use and removed after use.

### 4. Passkey (WebAuthn) Authentication

- **Setup:**
  - User registers a passkey device (browser/OS) using WebAuthn.
  - Credentials are stored securely in the database.
- **Login:**
  - User can login with passkey (no password needed).
  - WebAuthn challenge/response is verified server-side.
  - Audit log for all passkey actions.

### 5. User Actions

- **Profile Update:**
  - Only authenticated users can update their profile.
  - CSRF token required.
  - Audit log for changes.
- **Password Change:**
  - Old password required.
  - CSRF token required.
  - Password is hashed before update.
  - Audit log for success/failure.
- **Account Deletion:**
  - Password required for confirmation.
  - CSRF token required.
  - Audit log for deletion.

---

## Security Features

- **CSRF Protection:**
  - All sensitive actions require a valid CSRF token.
- **reCAPTCHA:**
  - Used on registration and login to prevent bots.
- **Password Hashing:**
  - bcryptjs with strong salt.
- **JWT Sessions:**
  - Signed with secret, stored as httpOnly, secure cookies.
- **Audit Logging:**
  - All auth and user actions are logged with timestamp, user, action, method, and result.
- **Error Handling:**
  - All errors are logged server-side, and generic messages are shown to users.
- **Backup Codes:**
  - One-time use, hashed, and only shown once to the user.
- **WebAuthn:**
  - Passkey credentials are stored securely, and challenge/response is verified per spec.

---

## Recommendations

- Always use HTTPS in production.
- Set strong JWT secrets and environment variables.
- Regularly rotate backup codes and passkeys.
- Monitor audit logs for suspicious activity.
- Add rate limiting and brute-force protection for public endpoints.

---

For more details, see the code in `/src/server/auth/` and `/src/server/user/`.
