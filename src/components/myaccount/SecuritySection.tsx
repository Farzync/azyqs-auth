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
import { usePasskeys } from "@/hooks/usePasskeys";
import { AuditLogSection } from "@/components/sections/security/AuditLogSection";
import { PasskeySection } from "@/components/sections/security/PasskeySection";
import { ShowAllPasskeysDialog } from "@/components/dialogs/ShowAllPasskeysDialog";
import { PasswordSection } from "@/components/sections/security/PasswordSection";
import { SecuritySectionSkeleton } from "@/components/sections/security/SecuritySkeleton";
import { MFASection } from "@/components/sections/security/MFASection";

export interface SecuritySectionProps {
  isLoading?: boolean;
}
export function SecuritySection({ isLoading = false }: SecuritySectionProps) {
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoadingMFA, setIsLoadingMFA] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    passkeys,
    isLoading: isLoadingPasskey,
    fetchPasskeys,
  } = usePasskeys();

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

  useEffect(() => {
    if (!isLoading) {
      fetchMFAStatus();
      fetchPasskeys();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleMFAChange = () => {
    fetchMFAStatus();
  };

  if (isLoading) {
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
            onShowAllPasskeys={() => setShowAllDialog(true)}
          />
          <ShowAllPasskeysDialog
            open={showAllDialog}
            onOpenChange={setShowAllDialog}
            onPasskeyChanged={fetchPasskeys}
          />

          <AuditLogSection />
        </CardContent>
      </Card>
    </div>
  );
}
