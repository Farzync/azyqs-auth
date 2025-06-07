<div align="center">

# 🔐 Azyqs-Auth

### *Next-Generation Authentication Platform*

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

*Production-ready authentication with WebAuthn, MFA, and comprehensive audit logging*

[🚀 Live Demo](#) • [📖 Documentation](#) • [🐛 Report Bug](#) • [💡 Request Feature](#)

---

</div>

## 🌟 **Why Azyqs-Auth?**

> **Enterprise-grade security meets developer-friendly experience**

Azyqs-Auth isn't just another auth starter—it's a complete authentication ecosystem designed for modern web applications. Built with the latest technologies and security best practices.

### ✨ **Key Highlights**

🔍 **Real-time Audit Logging** — Monitor every user action with detailed device, IP, and error tracking  
🔑 **Passwordless Authentication** — WebAuthn/Passkey support for seamless user experience  
🛡️ **Multi-Factor Security** — TOTP-based MFA with intelligent backup code management  
🎨 **Modern UI/UX** — Beautiful, accessible interface built with Radix UI and Tailwind CSS

---

## 🚀 **Features**

<table>
<tr>
<td width="50%">

### 🔐 **Authentication**
- ✅ Traditional login (username/email/password)
- ✅ Passwordless WebAuthn (passkeys)
- ✅ TOTP-based Multi-Factor Authentication
- ✅ Secure backup codes with smart regeneration
- ✅ JWT-based session management

</td>
<td width="50%">

### 🛡️ **Security & Management**
- ✅ Interactive real-time audit logging
- ✅ CSRF protection & rate limiting
- ✅ reCAPTCHA v3 integration
- ✅ Account management (profile, password, deletion)
- ✅ Device and IP tracking

</td>
</tr>
</table>

---

## 🏗️ **Tech Stack**

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15.3 • React 19.1 • TypeScript • Tailwind CSS 4.x |
| **Backend** | Next.js API Routes • Prisma ORM 6.8 • PostgreSQL 13+ |
| **Authentication** | WebAuthn • TOTP (Speakeasy) • JWT (Jose) • bcryptjs |
| **Validation** | Zod • React Hook Form • @hookform/resolvers |
| **UI/UX** | Radix UI • Lucide React • React Hot Toast |

</div>

---

## 📦 **Quick Start**

### Prerequisites

```bash
Node.js v20+
PostgreSQL v13+
pnpm (recommended)
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/azyqs-auth.git
cd azyqs-auth

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations
pnpm run prisma:migrate

# 5. Start development server
pnpm run dev
```

### 🔧 **Environment Setup**

<details>
<summary><b>📋 Required Environment Variables</b></summary>

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/azyqs_auth"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# reCAPTCHA
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"

# WebAuthn
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_RP_NAME="Azyqs Auth"
WEBAUTHN_ORIGIN="http://localhost:3000"
```

</details>

---

## 📁 **Project Structure**

```
azyqs-auth/
├── 📂 prisma/                 # Database schema & migrations
├── 📂 src/
│   ├── 📂 app/                # Next.js 15 app directory
│   ├── 📂 components/         # Reusable UI components
│   ├── 📂 contexts/           # React context providers
│   ├── 📂 hooks/              # Custom React hooks
│   ├── 📂 lib/                # Shared utilities
│   ├── 📂 server/             # API route handlers
│   ├── 📂 types/              # TypeScript definitions
│   └── 📂 utils/              # Helper functions
├── 📂 public/                 # Static assets
└── 📋 package.json
```

---

## 🔥 **What's New**

### v2.1.0 - Latest Release

🆕 **Enhanced WebAuthn Support** — Improved passkey registration and authentication flow  
🆕 **Advanced Audit Logging** — Real-time filtering and export capabilities  
🆕 **Smart MFA Management** — Intelligent backup code regeneration  
🆕 **Modern UI Refresh** — Updated components with improved accessibility  

<details>
<summary><b>📈 Previous Updates</b></summary>

### v2.0.0
- ✨ WebAuthn/Passkey implementation
- 🛡️ Multi-Factor Authentication with TOTP
- 📊 Interactive audit logging system
- 🎨 Complete UI/UX overhaul

### v1.5.0
- 🔐 JWT-based session management
- 🛡️ CSRF protection implementation
- 📱 Responsive design improvements

</details>

---

## 🧪 **Development**

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio

# Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript checks
```

### Recommended VS Code Extensions

- 🔧 Prisma
- 🎨 Tailwind CSS IntelliSense
- ✅ ESLint
- 🎯 Prettier
- 📝 TypeScript Importer

---

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌟 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. ✅ Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

### 📋 **Development Guidelines**

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass before submitting

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

<div align="center">

**Created with ❤️ by [Faeza Raziq](https://github.com/Farzync)**

*If this project helps you, please consider giving it a ⭐ star!*

[![GitHub followers](https://img.shields.io/github/followers/Farzync?style=social)](https://github.com/Farzync)
[![GitHub stars](https://img.shields.io/github/stars/Farzync/azyqs-auth?style=social)](https://github.com/Farzync/azyqs-auth)

---

### 💡 **Security Best Practices**

🔒 Always use HTTPS in production  
🔄 Rotate secrets regularly  
📊 Monitor audit logs frequently  
🛡️ Enable rate limiting  
🔐 Store backup codes securely  

---

*Built for developers, by developers. Secure by design, beautiful by default.*

</div>
