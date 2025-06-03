"use client";

import { useAuth } from "@/contexts/auth-context";
import { AccountInfo } from "@/components/myaccount/AccountInfo";
import { SecuritySection } from "@/components/myaccount/SecuritySection";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function ProfilePageSkeleton() {
  const router = useRouter();

  return (
    <main className="max-w-full sm:max-w-2xl md:max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">My Account</h1>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>
      <AccountInfo isLoading={true} />

      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Security</h1>
      <SecuritySection isLoading={true} />
    </main>
  );
}

export default function ProfileClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="max-w-full sm:max-w-2xl md:max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">My Account</h1>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>
      <AccountInfo user={user} />
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Security</h1>
      <SecuritySection />
    </main>
  );
}
