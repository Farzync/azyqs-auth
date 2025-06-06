import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserLock, Plus, List } from "lucide-react";
import toast from "react-hot-toast";
import type { Passkey } from "@/types/passkey";
import { registerPasskey } from "@/lib/auth/webauthnClient";
import { deleteCredentialAction } from "@/server/auth/webauthn/deleteCredential";
import { generatePasskeyOptionsAction } from "@/server/auth/webauthn/generatePasskeyOptions";
import { getUserCredentialsAction } from "@/server/auth/webauthn/getUserCredentials";
import { registerPasskeyAction } from "@/server/auth/webauthn/registerPasskey";
import { getDeviceInfo } from "@/utils/getDeviceInfo";
import { ShowAllPasskeysDialog } from "@/components/dialogs/ShowAllPasskeysDialog";

interface PasskeySectionProps {
  passkeys: Passkey[];
  isLoading: boolean;
  onPasskeysChange: () => Promise<Passkey[]>;
}

export function PasskeySection({
  passkeys,
  isLoading,
  onPasskeysChange,
}: PasskeySectionProps) {
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllDialog, setShowAllDialog] = useState(false);

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
      await onPasskeysChange();
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
      await onPasskeysChange();
    } catch {
      toast.error("Failed to delete passkey");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchPasskeysForDialog = async () => {
    const result = await getUserCredentialsAction();
    if ("error" in result) return [];
    return (result.credentials || []).map((pk) => ({
      ...pk,
      createdAt:
        typeof pk.createdAt === "string"
          ? pk.createdAt
          : pk.createdAt && typeof pk.createdAt.toISOString === "function"
          ? pk.createdAt.toISOString()
          : String(pk.createdAt),
    })) as Passkey[];
  };

  return (
    <>
      <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20 transition-colors hover:bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <UserLock className="h-5 w-5 text-muted-foreground" />
              Passkey Authentication
            </h3>
            <p className="text-sm text-muted-foreground">
              Use passkeys for passwordless login and enhanced security
            </p>
          </div>
          <div className="flex items-center gap-2 sm:ml-4">
            <span className="text-sm text-muted-foreground">Registered:</span>
            {isLoading ? (
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
            className="flex items-center gap-2 h-10 transition-all"
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
            className="flex items-center gap-2 h-10 transition-all"
            disabled={isLoading}
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
        fetchPasskeys={fetchPasskeysForDialog}
        onDelete={handleDeletePasskey}
        deletingId={deletingId}
      />
    </>
  );
}
