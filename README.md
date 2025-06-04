# Azyqs-Auth

A modern, full-stack authentication and account management web application built with Next.js, Prisma, PostgreSQL, and React. This project is designed to provide secure, scalable, and user-friendly authentication features, including multi-factor authentication (MFA), WebAuthn (passkey) support, audit logging, and more.

---

## 🚀 Description

**Azyqs-Web** is a robust authentication platform that demonstrates best practices in user security, modern UI/UX, and developer experience. It is suitable as a starter kit for SaaS products, internal tools, or any web application requiring advanced authentication and account management.

---

## 🆕 Latest Updates

- **WebAuthn (Passkey) Support**: Register and login with passkeys for passwordless authentication.
- **Multi-Factor Authentication (MFA)**: TOTP-based MFA with backup codes.
- **Audit Logging**: Track user actions and security events.
- **ReCAPTCHA Integration**: Protect login and registration from bots.
- **Modern UI**: Built with Radix UI, Tailwind CSS, and custom components.
- **Improved Security**: CSRF protection, JWT-based sessions, and secure password hashing.

---

## ✨ Features

- User registration and login (username/email/password)
- Passwordless login with WebAuthn (passkey)
- TOTP-based MFA with backup codes
- Account management (update profile, change password, delete account)
- Audit log viewer for users
- ReCAPTCHA v3 integration
- Responsive, accessible UI
- Modular, scalable codebase

---

## 🛠️ Tech Stack & Modules

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Radix UI
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Authentication**: bcryptjs, JWT, WebAuthn (simplewebauthn), TOTP (speakeasy)
- **Validation**: Zod, React Hook Form
- **Security**: CSRF protection, ReCAPTCHA, audit logging
- **Other**: Lucide React (icons), React Hot Toast (notifications), QRCode (for MFA setup)

---

## 📁 Project Structure

```
prisma/           # Prisma schema & migrations
src/
  app/            # Next.js app directory (pages, layouts, error handling)
  components/     # UI components (dialogs, forms, sections, etc.)
  contexts/       # React context providers
  hooks/          # Custom React hooks
  lib/            # Server/client utilities (auth, db, etc.)
  server/         # API route handlers (auth, user, etc.)
  types/          # TypeScript types
  utils/          # Utility functions
public/           # Static assets
```

---

## 📦 Main Dependencies

- `next`, `react`, `react-dom`
- `@prisma/client`, `prisma`, `pg`
- `@hookform/resolvers`, `react-hook-form`, `zod`
- `@simplewebauthn/browser`, `@simplewebauthn/server`, `speakeasy`
- `tailwindcss`, `radix-ui`, `lucide-react`
- `bcryptjs`, `jsonwebtoken`, `cookie`, `qrcode`

---

## ⚡ Getting Started

1. **Clone the repository**
2. **Install dependencies**
   ```sh
   pnpm install
   # or
   npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your secrets.
4. **Run database migrations**
   ```sh
   pnpm run prisma:migrate
   ```
5. **Start the development server**
   ```sh
   pnpm run dev
   ```

---

## 📜 License

This project is open source under the MIT License. You are free to use, modify, and distribute it, but **please give credit to the original author**.

---

## 🙏 Credits

Developed by [azyqs](https://github.com/azyqs). If you use this project, please star the repo and mention me in your credits!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repository and submit pull requests.

---

## 📧 Contact

For questions or support, open an issue or contact me via GitHub.
