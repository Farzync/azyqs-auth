import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound } from "lucide-react";
import { TOTPSetupDialog } from "@/components/dialogs/TOTPSetupDialog";
import { TOTPDisableDialog } from "@/components/dialogs/TOTPDisableDialog";
import { RegenerateBackupCodesDialog } from "@/components/dialogs/RegenerateBackupCodesDialog";

interface TOTPSectionProps {
  totpEnabled: boolean;
  isLoading: boolean;
  onTOTPChange: () => void;
}

export function TOTPSection({
  totpEnabled,
  isLoading,
  onTOTPChange,
}: TOTPSectionProps) {
  return (
    <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20 transition-colors hover:bg-muted/30">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2 flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account with TOTP
          </p>
        </div>
        <div className="flex items-center gap-2 sm:ml-4">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isLoading ? (
            <Skeleton className="h-6 w-16 rounded-full" />
          ) : (
            <Badge
              variant={totpEnabled ? "default" : "secondary"}
              className={
                totpEnabled
                  ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
              }
            >
              {totpEnabled ? "Enabled" : "Disabled"}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </>
        ) : totpEnabled ? (
          <>
            <RegenerateBackupCodesDialog onSuccess={onTOTPChange} />
            <TOTPDisableDialog onSuccess={onTOTPChange} />
          </>
        ) : (
          <div className="sm:col-span-2">
            <TOTPSetupDialog onSuccess={onTOTPChange} />
          </div>
        )}
      </div>
    </div>
  );
}
