import { useState } from "react";
import { Button } from "@/components/ui/button";
import { History, Eye } from "lucide-react";
import { ShowUserAuditLogDialog } from "@/components/dialogs/ShowUserAuditLogDialog";
import { getCurrentUserAuditLogs } from "@/server/user/auditLogUser";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";

interface ServerAuditLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string;
  userAgent: string;
  method: string | null;
  success: boolean | null;
  errorMessage: string | null;
  at: string | Date;
}

export function AuditLogSection() {
  const [showAuditLogDialog, setShowAuditLogDialog] = useState(false);

  const fetchAuditLogs = async (cursor?: { at: Date; id: string } | null) => {
    try {
      const validCursor = cursor === null ? undefined : cursor;
      const result = await getCurrentUserAuditLogs(20, validCursor);
      const validActions = Object.values(AuditLogAction);
      const validMethods = Object.values(AuditLogMethod);
      return {
        logs: result.logs.map((log: ServerAuditLog) => ({
          id: log.id,
          userId: log.userId,
          action: validActions.includes(log.action as AuditLogAction)
            ? (log.action as AuditLogAction)
            : AuditLogAction.LOGIN,
          details: log.details ?? undefined,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent ?? undefined,
          method:
            log.method && validMethods.includes(log.method as AuditLogMethod)
              ? (log.method as AuditLogMethod)
              : undefined,
          success: log.success ?? undefined,
          errorMessage: log.errorMessage ?? undefined,
          at: log.at ? new Date(log.at) : new Date(),
        })),
        nextCursor: result.nextCursor
          ? {
              at: new Date(result.nextCursor.at),
              id: result.nextCursor.id,
            }
          : null,
      };
    } catch {
      return { logs: [], nextCursor: null };
    }
  };

  return (
    <>
      <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20 transition-colors hover:bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Audit Log
            </h3>
            <p className="text-sm text-muted-foreground">
              View your account security activity history
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Button
              variant="outline"
              onClick={() => setShowAuditLogDialog(true)}
              className="flex items-center gap-2 h-10 w-full transition-all hover:scale-[1.02]"
            >
              <Eye className="h-4 w-4" />
              View Audit Log
            </Button>
          </div>
        </div>
      </div>

      <ShowUserAuditLogDialog
        open={showAuditLogDialog}
        onOpenChange={setShowAuditLogDialog}
        fetchAuditLogs={fetchAuditLogs}
      />
    </>
  );
}
