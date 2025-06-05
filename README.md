# Azyqs-Auth

A modern, production-ready authentication and account management platform built with **Next.js 15**, **React 19**, **Prisma ORM**, and **PostgreSQL**.  
This project delivers secure, scalable, and user-friendly authentication features, including:

- Multi-Factor Authentication (MFA) with TOTP & backup codes
- WebAuthn (passkey) support for passwordless login
- Interactive, detailed audit logging (track all user/security events)
- Modern, accessible UI/UX (Radix UI, Tailwind CSS)
- And much more!

> **Why Azyqs-Auth?**
>
> - Real-time, filterable audit log for all user actions (login, profile changes, MFA, passkey, etc.)
> - Secure backup code management (regeneration only if MFA is active, all actions logged)
> - Designed for SaaS, internal tools, or any app needing robust authentication

---

## 🚀 Description

**Azyqs-Auth** is a robust authentication starter kit and reference implementation.  
It demonstrates best practices in user security, modern UI/UX, and developer experience.  
**Key highlight:**

> **Interactive Audit Log:** Users can monitor all account activity (login, profile changes, MFA, passkey, etc.) in real-time, with device, IP, status, and error details—directly from the UI.

---

## 🆕 Latest Updates

- **WebAuthn (Passkey) Support:** Register and login with passkeys for passwordless authentication.
- **Multi-Factor Authentication (MFA):** TOTP-based MFA with backup codes (backup codes can only be regenerated if MFA is active; all actions are logged).
- **Interactive Audit Logging:** Monitor all account activity (login, profile changes, MFA, passkey, etc.) in detail and in real-time from the UI. Every important action, success or failure, is logged with timestamp, device, IP, and error (if any).
- **ReCAPTCHA Integration:** Protect login and registration from bots.
- **Modern UI:** Built with Radix UI, Tailwind CSS, and custom components.
- **Improved Security:** CSRF protection, JWT-based sessions, secure password hashing, and more.

---

## ✨ Features

- User registration and login (username/email/password)
- Passwordless login with WebAuthn (passkey)
- TOTP-based MFA with backup codes (regeneration only if MFA is active, all actions logged)
- Account management (update profile, change password, delete account)
- **Interactive Audit Log:** Real-time, filterable account activity history (success/failure, device, IP, error details)
- reCAPTCHA v3 integration
- Responsive, accessible, and modern UI
- Modular, scalable, and type-safe codebase

---

## 🛠️ Tech Stack & Main Modules

- **Frontend:** Next.js 15.3.x, React 19.1.x, Tailwind CSS 4.x, Radix UI, Lucide React (icons)
- **Backend:** Next.js API routes, Prisma ORM 6.x, PostgreSQL (>=13)
- **Authentication:** bcryptjs, JWT (jose), WebAuthn (simplewebauthn), TOTP (speakeasy)
- **Validation:** Zod, React Hook Form
- **Security:** CSRF protection, reCAPTCHA, detailed audit logging (user & security events)
- **Other:** React Hot Toast (notifications), QRCode (for MFA setup)

---

## 📁 Project Structure

```
prisma/           # Prisma schema & migrations
src/
  app/            # Next.js app directory (routing, layouts, error handling)
  components/     # UI components (dialogs, forms, sections, etc.)
  contexts/       # React context providers
  hooks/          # Custom React hooks
  lib/            # Shared utilities (auth, db, etc.)
  server/         # API route handlers (auth, user, etc.)
  types/          # TypeScript types
  utils/          # Utility functions
public/           # Static assets
```

---

## 📦 Main Dependencies & Versions

- `next@15.3.x`, `react@19.1.x`, `react-dom@19.1.x`
- `@prisma/client@6.8.x`, `prisma@6.8.x`, `pg@8.16.x`
- `@hookform/resolvers@5.x`, `react-hook-form@7.x`, `zod@3.x`
- `@simplewebauthn/browser@13.x`, `@simplewebauthn/server@13.x`, `speakeasy@2.x`
- `tailwindcss@4.x`, `radix-ui`, `lucide-react@0.511.x`
- `bcryptjs@3.x`, `jose@6.x` (JWT), `cookie@1.x`, `qrcode@1.5.x`

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** v20+ (recommended)
- **pnpm** (recommended) or npm
- **PostgreSQL** v13+ (local or remote)

### Quick Start

1. **Clone the repository**
2. **Install dependencies**
   ```powershell
   pnpm install
   # or
   npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in all required secrets (see below).
4. **Run database migrations**
   ```powershell
   pnpm run prisma:migrate
   ```
5. **Start the development server**
   ```powershell
   pnpm run dev
   ```

### Environment Variables

You must set the following in your `.env` file:

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (strong random string)
- `RECAPTCHA_SECRET_KEY` (Google reCAPTCHA v3 secret)
- ...and others as needed (see `.env.example`)

### Recommended Extensions (VS Code)

- Prisma, Tailwind CSS IntelliSense, ESLint, Prettier

---

## 📜 License

This project is open source under the MIT License.  
You are free to use, modify, and distribute it, but **please give credit to the original author**.

---

## 🙏 Credits

Developed by [Faeza Raziq](https://github.com/Farzync).  
If you use this project, please star the repo and mention me in your credits!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to fork the repository and submit pull requests.

---

## 📧 Contact

For questions or support, open an issue or contact me via GitHub.

---

## 💡 Tips & Best Practices

- Use the **Audit Log** to monitor all account activity and security events.
- Regenerate backup codes regularly and store them securely.
- Always use HTTPS in production.
- Review and rotate secrets (JWT, database, reCAPTCHA) periodically.
- For production, enable rate limiting and brute-force protection.

---
