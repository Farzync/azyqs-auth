export const metadata = {
  title: "Register",
  description: "Create a new account to get started.",
};

import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <RegisterForm />
    </main>
  );
}
