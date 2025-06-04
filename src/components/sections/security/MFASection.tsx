import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound } from "lucide-react";
import { MFASecuritySetupDialog } from "@/components/dialogs/MFASecuritySetupDialog";
import { MFASecurityDisableDialog } from "@/components/dialogs/MFASecurityDisableDialog";
import { RegenerateBackupCodesDialog } from "@/components/dialogs/RegenerateBackupCodesDialog";

export interface MFASectionProps {
  mfaEnabled: boolean;
  isLoading: boolean;
  onMFAChange: () => void;
}

export function MFASection({
  mfaEnabled,
  isLoading,
  onMFAChange,
}: MFASectionProps) {
  return (
    <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20 transition-colors hover:bg-muted/30">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2 flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Multi-Factor Authentication
          </h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account with MFA
          </p>
        </div>
        <div className="flex items-center gap-2 sm:ml-4">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isLoading ? (
            <Skeleton className="h-6 w-16 rounded-full" />
          ) : (
            <Badge
              variant={mfaEnabled ? "default" : "secondary"}
              className={
                mfaEnabled
                  ? "bg-green-600 text-white border-green-700 dark:bg-green-500 dark:text-black dark:border-green-600"
                  : "bg-yellow-500 text-black border-yellow-600 dark:bg-yellow-400 dark:text-black dark:border-yellow-500"
              }
            >
              {mfaEnabled ? "Enabled" : "Disabled"}
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
        ) : mfaEnabled ? (
          <>
            <RegenerateBackupCodesDialog onSuccess={onMFAChange} />
            <MFASecurityDisableDialog onSuccess={onMFAChange} />
          </>
        ) : (
          <div className="sm:col-span-2">
            <MFASecuritySetupDialog onSuccess={onMFAChange} />
          </div>
        )}
      </div>
    </div>
  );
}
