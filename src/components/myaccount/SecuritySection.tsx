"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { TOTPSetupDialog } from "@/components/dialogs/TOTPSetupDialog";
import { TOTPDisableDialog } from "@/components/dialogs/TOTPDisableDialog";
import { RegenerateBackupCodesDialog } from "@/components/dialogs/RegenerateBackupCodesDialog";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";
import { getTOTPStatusAction } from "@/server/auth";
import { Lock, Shield, Plus, List, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Passkey } from "@/types/passkey";
import { registerPasskey } from "@/lib/auth/webauthnClient";
import { deleteCredentialAction } from "@/server/auth/webauthn/deleteCredential";
import { generatePasskeyOptionsAction } from "@/server/auth/webauthn/generatePasskeyOptions";
import { getUserCredentialsAction } from "@/server/auth/webauthn/getUserCredentials";
import { registerPasskeyAction } from "@/server/auth/webauthn/registerPasskey";
import { getDeviceInfo } from "@/utils/getDeviceInfo";
import { ShowAllPasskeysDialog } from "@/components/dialogs/ShowAllPasskeysDialog";

interface SecuritySectionProps {
  isLoading?: boolean;
}

export function SecuritySection({
  isLoading: propIsLoading = false,
}: SecuritySectionProps) {
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [isLoadingTOTP, setIsLoadingTOTP] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoadingPasskey, setIsLoadingPasskey] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllDialog, setShowAllDialog] = useState(false);

  const fetchTOTPStatus = async () => {
    setIsLoadingTOTP(true);
    setError(null);

    try {
      const result = await getTOTPStatusAction();

      if ("error" in result) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        setTotpEnabled(result.isEnabled);
      }
    } catch {
      setError("Failed to load security settings");
    } finally {
      setIsLoadingTOTP(false);
    }
  };

  const fetchPasskeys = async () => {
    setIsLoadingPasskey(true);
    try {
      const result = await getUserCredentialsAction();
      if ("error" in result) {
        toast.error(result.error);
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
      toast.error("Failed to load passkeys");
      setPasskeys([]);
      return [];
    } finally {
      setIsLoadingPasskey(false);
    }
  };

  useEffect(() => {
    if (!propIsLoading) {
      fetchTOTPStatus();
      fetchPasskeys();
    }
  }, [propIsLoading]);

  const handleRegisterPasskey = async () => {
    setRegistering(true);
    try {
      const optRes = await generatePasskeyOptionsAction();
      if ("error" in optRes) {
        throw new Error(optRes.error || "Failed to get options");
      }
      const response = await registerPasskey(optRes.options);

      const { deviceName, deviceOS } = getDeviceInfo();
      const regRes = await registerPasskeyAction(response, {
        deviceName,
        deviceOS,
      });

      if ("error" in regRes) {
        throw new Error(regRes.error || "Failed to register passkey");
      }

      toast.success("Passkey registered successfully!");
      await fetchPasskeys();
    } catch {
      toast.error("Failed to register passkey");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteCredentialAction(id);

      if ("error" in res) {
        throw new Error(res.error || "Failed to delete passkey");
      }

      toast.success("Passkey deleted successfully!");
      await fetchPasskeys();
    } catch {
      toast.error("Failed to delete passkey");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTOTPChange = () => {
    fetchTOTPStatus();
  };

  if (propIsLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication settings
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Regularly update your password to keep your account secure
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Current Password
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Skeleton className="flex-1 h-10 rounded-lg" />
                <Skeleton className="h-10 w-full sm:w-32 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account with TOTP
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Passkey Authentication
              </h3>
              <p className="text-sm text-muted-foreground">
                Use passkeys for passwordless login and enhanced security
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          Security Settings
        </CardTitle>
        <CardDescription>
          Manage your account security and authentication settings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/5 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">Security Settings Error</p>
            <p className="text-sm mt-1">{error}</p>
          </Alert>
        )}

        <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              Regularly update your password to keep your account secure
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Current Password
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center h-10 px-3 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border font-mono">
                ••••••••••••
              </div>
              <div className="w-full sm:w-auto">
                <ChangePasswordDialog />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account with TOTP
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">Status:</span>
              {isLoadingTOTP ? (
                <Skeleton className="h-6 w-16 rounded-full" />
              ) : (
                <Badge
                  variant={totpEnabled ? "default" : "secondary"}
                  className={
                    totpEnabled
                      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                      : ""
                  }
                >
                  {totpEnabled ? "Enabled" : "Disabled"}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isLoadingTOTP ? (
              <>
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </>
            ) : totpEnabled ? (
              <>
                <RegenerateBackupCodesDialog onSuccess={handleTOTPChange} />
                <TOTPDisableDialog onSuccess={handleTOTPChange} />
              </>
            ) : (
              <div className="sm:col-span-2">
                <TOTPSetupDialog onSuccess={handleTOTPChange} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6 border border-border rounded-xl bg-card">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Passkey Authentication
              </h3>
              <p className="text-sm text-muted-foreground">
                Use passkeys for passwordless login and enhanced security
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">Registered:</span>
              {isLoadingPasskey ? (
                <Skeleton className="h-6 w-8 rounded" />
              ) : (
                <Badge variant="outline" className="font-mono text-xs">
                  {passkeys.length}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleRegisterPasskey}
              disabled={registering}
              variant="default"
              className="flex items-center gap-2 h-10"
            >
              {registering ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Registering...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Register New Passkey
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowAllDialog(true)}
              className="flex items-center gap-2 h-10"
              disabled={isLoadingPasskey}
            >
              <List className="h-4 w-4" />
              Manage Passkeys
              {passkeys.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {passkeys.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <ShowAllPasskeysDialog
          open={showAllDialog}
          onOpenChange={setShowAllDialog}
          fetchPasskeys={async () => {
            const result = await getUserCredentialsAction();
            if ("error" in result) return [];
            return (result.credentials || []).map((pk) => ({
              ...pk,
              createdAt:
                typeof pk.createdAt === "string"
                  ? pk.createdAt
                  : pk.createdAt &&
                    typeof pk.createdAt.toISOString === "function"
                  ? pk.createdAt.toISOString()
                  : String(pk.createdAt),
            })) as Passkey[];
          }}
          onDelete={handleDeletePasskey}
          deletingId={deletingId}
        />
      </CardContent>
    </Card>
  );
}
