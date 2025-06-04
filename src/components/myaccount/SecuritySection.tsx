"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { getMFAStatusAction } from "@/server/auth";
import { getUserCredentialsAction } from "@/server/auth/webauthn/getUserCredentials";
import type { Passkey } from "@/types/passkey";
import { AuditLogSection } from "../sections/security/AuditLogSection";
import { PasskeySection } from "../sections/security/PasskeySection";
import { PasswordSection } from "../sections/security/PasswordSection";
import { SecuritySectionSkeleton } from "../sections/security/SecuritySkeleton";
import { MFASection } from "../sections/security/MFASection";

interface SecuritySectionProps {
  isLoading?: boolean;
}

export function SecuritySection({
  isLoading: propIsLoading = false,
}: SecuritySectionProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoadingMFA, setIsLoadingMFA] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoadingPasskey, setIsLoadingPasskey] = useState(true);

  const fetchMFAStatus = async () => {
    setIsLoadingMFA(true);
    setError(null);

    try {
      const result = await getMFAStatusAction();

      if ("error" in result) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        setMfaEnabled(result.isEnabled);
      }
    } catch {
      setError("Failed to load security settings");
    } finally {
      setIsLoadingMFA(false);
    }
  };

  const fetchPasskeys = async () => {
    setIsLoadingPasskey(true);
    try {
      const result = await getUserCredentialsAction();
      if ("error" in result) {
        setPasskeys([]);
        return [];
      } else {
        const mapped = (result.credentials || []).map((pk) => ({
          ...pk,
          createdAt:
            typeof pk.createdAt === "string"
              ? pk.createdAt
              : pk.createdAt && typeof pk.createdAt.toISOString === "function"
              ? pk.createdAt.toISOString()
              : String(pk.createdAt),
        })) as Passkey[];
        setPasskeys(mapped);
        return mapped;
      }
    } catch {
      setPasskeys([]);
      return [];
    } finally {
      setIsLoadingPasskey(false);
    }
  };

  useEffect(() => {
    if (!propIsLoading) {
      fetchMFAStatus();
      fetchPasskeys();
    }
  }, [propIsLoading]);

  const handleMFAChange = () => {
    fetchMFAStatus();
  };

  if (propIsLoading) {
    return <SecuritySectionSkeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-sm border border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">Security Settings</h2>
              <CardDescription className="mt-1">
                Manage your account security and authentication settings
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-destructive/50 bg-destructive/5 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-sm font-medium">Security Settings Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </Alert>
          )}

          <PasswordSection />

          <MFASection
            mfaEnabled={mfaEnabled}
            isLoading={isLoadingMFA}
            onMFAChange={handleMFAChange}
          />

          <PasskeySection
            passkeys={passkeys}
            isLoading={isLoadingPasskey}
            onPasskeysChange={fetchPasskeys}
          />

          <AuditLogSection />
        </CardContent>
      </Card>
    </div>
  );
}
