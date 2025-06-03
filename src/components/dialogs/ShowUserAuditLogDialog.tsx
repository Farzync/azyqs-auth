import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  LogIn,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Monitor,
  MapPin,
  Key,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  UserPlus,
  KeyRound,
  AlertCircle,
  History,
} from "lucide-react";
import { getDeviceInfo as getDeviceInfoFromUA } from "@/utils/getDeviceInfo";
import { Skeleton } from "@/components/ui/skeleton";

export enum AuditLogAction {
  REGISTER = "register",
  LOGIN = "login",
  EDIT_PROFILE = "edit_profile",
  CHANGE_PASSWORD = "change_password",
  REGENERATE_BACKUP_CODE = "regenerate_backup_code",
  ENABLE_MFA = "enable_mfa",
  DISABLE_MFA = "disable_mfa",
  REGISTER_PASSKEY = "register_passkey",
  UNREGISTER_PASSKEY = "unregister_passkey",
  DELETE_ACCOUNT = "delete_account",
}

export enum AuditLogMethod {
  PASSWORD = "password",
  PASSKEY = "passkey",
  MFA_BACKUP = "mfa_backup",
  MFA = "mfa",
}

export type AuditLogParams = {
  userId: string;
  action: AuditLogAction;
  details?: string;
  ipAddress: string;
  userAgent?: string;
  method?: AuditLogMethod;
  success?: boolean;
  errorMessage?: string;
  at?: Date;
};

type UserAuditLog = {
  id: string;
  userId: string;
  action: AuditLogAction;
  details?: string;
  ipAddress: string;
  userAgent?: string;
  method?: AuditLogMethod;
  success?: boolean;
  errorMessage?: string;
  at: Date;
};

interface ShowUserAuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchAuditLogs: (cursor?: { at: Date; id: string } | null) => Promise<{
    logs: UserAuditLog[];
    nextCursor: { at: Date; id: string } | null;
  }>;
}

const getActionIcon = (action: AuditLogAction) => {
  switch (action) {
    case AuditLogAction.LOGIN:
      return LogIn;
    case AuditLogAction.REGISTER:
      return UserPlus;
    case AuditLogAction.EDIT_PROFILE:
      return Settings;
    case AuditLogAction.CHANGE_PASSWORD:
      return Key;
    case AuditLogAction.REGENERATE_BACKUP_CODE:
      return RefreshCw;
    case AuditLogAction.ENABLE_MFA:
      return Lock;
    case AuditLogAction.DISABLE_MFA:
      return Unlock;
    case AuditLogAction.REGISTER_PASSKEY:
      return KeyRound;
    case AuditLogAction.UNREGISTER_PASSKEY:
      return KeyRound;
    case AuditLogAction.DELETE_ACCOUNT:
      return Trash2;
    default:
      return Shield;
  }
};

const getActionDisplayName = (action: AuditLogAction) => {
  const actionMap: Record<AuditLogAction, string> = {
    [AuditLogAction.LOGIN]: "Sign In",
    [AuditLogAction.REGISTER]: "Account Registration",
    [AuditLogAction.EDIT_PROFILE]: "Profile Update",
    [AuditLogAction.CHANGE_PASSWORD]: "Password Change",
    [AuditLogAction.REGENERATE_BACKUP_CODE]: "Backup Code Regenerated",
    [AuditLogAction.ENABLE_MFA]: "Two-Factor Authentication Enabled",
    [AuditLogAction.DISABLE_MFA]: "Two-Factor Authentication Disabled",
    [AuditLogAction.REGISTER_PASSKEY]: "Passkey Registered",
    [AuditLogAction.UNREGISTER_PASSKEY]: "Passkey Removed",
    [AuditLogAction.DELETE_ACCOUNT]: "Account Deletion",
  };
  return actionMap[action] || action;
};

const getMethodDisplayName = (method: AuditLogMethod) => {
  const methodMap: Record<AuditLogMethod, string> = {
    [AuditLogMethod.PASSWORD]: "Password",
    [AuditLogMethod.PASSKEY]: "Passkey",
    [AuditLogMethod.MFA_BACKUP]: "Backup Code",
    [AuditLogMethod.MFA]: "2FA Code",
  };
  return methodMap[method] || method;
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getDeviceInfoString = (userAgent: string) => {
  if (!userAgent) return "Unknown Device";
  const { deviceName, deviceOS } = getDeviceInfoFromUA();
  return `${deviceName} on ${deviceOS}`;
};

const getActionColor = (action: AuditLogAction, success?: boolean) => {
  if (success === false) return "destructive";

  switch (action) {
    case AuditLogAction.DELETE_ACCOUNT:
    case AuditLogAction.DISABLE_MFA:
    case AuditLogAction.UNREGISTER_PASSKEY:
      return "orange";
    case AuditLogAction.ENABLE_MFA:
    case AuditLogAction.REGISTER_PASSKEY:
    case AuditLogAction.REGENERATE_BACKUP_CODE:
      return "green";
    case AuditLogAction.LOGIN:
    case AuditLogAction.REGISTER:
      return "blue";
    default:
      return "primary";
  }
};

export function ShowUserAuditLogDialog({
  open,
  onOpenChange,
  fetchAuditLogs,
}: ShowUserAuditLogDialogProps) {
  const [logs, setLogs] = useState<UserAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<{ at: Date; id: string } | null>(
    null
  );
  const [hasMore, setHasMore] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (open && !hasFetched) {
      setIsLoading(true);
      setError(null);
      fetchAuditLogs(null)
        .then((result) => {
          setLogs(result.logs);
          setNextCursor(result.nextCursor);
          setHasMore(!!result.nextCursor);
        })
        .catch((e) => setError(e?.message || "Failed to load audit logs"))
        .finally(() => {
          setIsLoading(false);
          setHasFetched(true);
        });
    }
    if (!open) {
      setHasFetched(false);
      setLogs([]);
      setError(null);
      setNextCursor(null);
      setHasMore(true);
    }
  }, [open, hasFetched, fetchAuditLogs]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!hasMore || isLoading || error) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 64) {
      setIsLoading(true);
      fetchAuditLogs(nextCursor)
        .then((result) => {
          setLogs((prev) => [...prev, ...result.logs]);
          setNextCursor(result.nextCursor);
          setHasMore(!!result.nextCursor);
        })
        .catch((e) => setError(e?.message || "Failed to load audit logs"))
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            Security Activity
          </DialogTitle>
          <DialogDescription className="text-base">
            Monitor your account&apos;s security events and login history
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="p-3 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Unable to Load Activity
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {error}
              </p>
            </div>
          ) : logs.length === 0 && isLoading ? (
            <div className="space-y-4 p-4 h-full hide-scrollbar">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 border rounded-xl bg-card/50"
                >
                  <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center h-full flex items-center justify-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-6">
                  <Shield className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Security Activity
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your security activity will appear here once you start using
                  your account
                </p>
              </div>
            </div>
          ) : (
            <div
              className="h-full p-4 space-y-3 hide-scrollbar"
              onScroll={handleScroll}
              tabIndex={0}
              role="list"
            >
              {logs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const actionName = getActionDisplayName(log.action);
                const relativeTime = getRelativeTime(new Date(log.at));
                const deviceInfo = getDeviceInfoString(log.userAgent || "");
                const colorScheme = getActionColor(log.action, log.success);

                return (
                  <div
                    key={log.id}
                    className="group flex items-start gap-4 p-4 border rounded-xl bg-card/50 hover:bg-card transition-colors"
                  >
                    <div
                      className={`flex items-center justify-center h-12 w-12 rounded-xl flex-shrink-0 ${
                        log.success === false
                          ? "bg-destructive/10 text-destructive"
                          : colorScheme === "green"
                          ? "bg-green-500/10 text-green-600"
                          : colorScheme === "orange"
                          ? "bg-orange-500/10 text-orange-600"
                          : colorScheme === "blue"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <ActionIcon className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <h4 className="text-base font-semibold text-foreground truncate">
                            {actionName}
                          </h4>
                          {log.success === false ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 flex-shrink-0">
                              <XCircle className="h-3 w-3 text-destructive" />
                              <span className="text-xs font-medium text-destructive">
                                Failed
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-medium text-green-600">
                                Success
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                          {relativeTime}
                        </span>
                      </div>

                      {log.details && (
                        <p className="text-sm text-muted-foreground leading-relaxed break-words">
                          {log.details}
                        </p>
                      )}

                      {log.errorMessage && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-destructive break-words">
                            {log.errorMessage}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-muted-foreground/80">
                          {new Date(log.at).toLocaleString()}
                        </span>

                        {log.method && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50">
                            <Key className="h-3 w-3" />
                            <span className="font-medium">
                              {getMethodDisplayName(log.method)}
                            </span>
                          </div>
                        )}

                        {log.ipAddress && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{log.ipAddress}</span>
                          </div>
                        )}

                        {log.userAgent && (
                          <div className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            <span className="truncate max-w-xs">
                              {deviceInfo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">
                      Loading more activity...
                    </span>
                  </div>
                </div>
              )}

              {!hasMore && logs.length > 0 && (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">
                      You&apos;ve reached the end
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
