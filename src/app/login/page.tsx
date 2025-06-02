export const metadata = {
  title: "Login",
  description: "Log in to your account to continue.",
};

import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
