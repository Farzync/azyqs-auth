# Security Overview

This document details the security model, authentication flow, and user action protections implemented in **Azyqs-Auth**. It is designed to help developers, auditors, and users understand how security is enforced and monitored throughout the application.

---

---

## 🔐 Authentication Flow

### 1. Registration

- **Validations:**
  - All fields validated with Zod schemas (type-safe, server-side validation)
  - CSRF token and Google reCAPTCHA required
  - Passwords are hashed with bcryptjs before storage
- **Security:**
  - Duplicate email/username checks
  - **Audit log** for all registration attempts (success/failure, device, IP)

### 2. Login

- **Validations:**
  - Username/email and password validated
  - CSRF token and reCAPTCHA required
- **Security:**
  - Password checked with bcryptjs
  - If MFA is enabled, user must complete TOTP or backup code verification
  - If Passkey (WebAuthn) is enabled, user can login passwordlessly
  - JWT session token set as httpOnly, secure cookie
  - **Audit log** for all login attempts (success/failure, device, IP, method, error)

### 3. Multi-Factor Authentication (MFA)

- **Setup:**
  - User generates a TOTP secret (QR code) and verifies with a code from their authenticator app
  - Backup codes are generated and stored (hashed, one-time view)
  - **Audit log** for every setup, enable, disable, backup code regeneration, and failed attempt
- **Verification:**
  - TOTP code or backup code required after password login if MFA is enabled
  - CSRF token required for all MFA actions
  - Backup codes can only be regenerated if MFA is active; all actions (success/failure) are logged
  - Backup codes are one-time use and deleted after use

### 4. Passkey (WebAuthn) Authentication

- **Setup:**
  - User registers a passkey device (browser/OS) using WebAuthn
  - Credentials are stored securely in the database
- **Login:**
  - User can login with passkey (no password needed)
  - WebAuthn challenge/response is verified server-side
  - **Audit log** for all passkey actions (register, remove, login)

### 5. User Actions

- **Profile Update:**
  - Only authenticated users can update their profile
  - CSRF token required
  - All changes are logged in the audit log
- **Password Change:**
  - Old password required
  - CSRF token required
  - Password is hashed before update
  - **Audit log** for every action (success/failure)
- **Account Deletion:**
  - Password required for confirmation
  - CSRF token required
  - **Audit log** for account deletion

---

---

## 🛡️ Security Features

- **CSRF Protection:**
  - All sensitive actions require a valid CSRF token
- **reCAPTCHA:**
  - Used on registration and login to prevent bots
- **Password Hashing:**
  - bcryptjs with strong salt
- **JWT Sessions:**
  - Signed with secret, stored as httpOnly, secure cookies
- **Audit Logging:**
  - All important actions (login, register, MFA, passkey, backup code, etc.) are logged with timestamp, user, action, method, device, IP, status (success/failure), and error (if any)
  - Users can view their own account activity history directly from the UI (interactive audit log)
- **Error Handling:**
  - All errors are logged server-side; user-facing messages are generic and safe
- **Backup Codes:**
  - One-time use, hashed, only shown once to the user, can only be regenerated if MFA is active
- **WebAuthn:**
  - Passkey credentials are stored securely, challenge/response is verified per spec

---

---

## 💡 Recommendations & Best Practices

- Always use HTTPS in production
- Use strong JWT secrets and environment variables
- Regularly rotate backup codes and passkeys
- **Monitor the user audit log regularly to detect suspicious activity**
- Add rate limiting and brute-force protection for public endpoints

---

---

For more details, see the code in `/src/server/auth/` and `/src/server/user/`.
