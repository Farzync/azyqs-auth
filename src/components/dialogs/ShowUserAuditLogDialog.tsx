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
  ChevronDown,
} from "lucide-react";
import { getDeviceInfo as getDeviceInfoFromUA } from "@/utils/getDeviceInfo";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditLogAction, AuditLogMethod } from "@/types/auditlog";
import { getRelativeTime } from "@/utils/formatters";

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

const getUserActionDisplayName = (action: AuditLogAction) => {
  const actionMap: Record<AuditLogAction, string> = {
    [AuditLogAction.LOGIN]: "Sign In",
    [AuditLogAction.REGISTER]: "Account Registration",
    [AuditLogAction.EDIT_PROFILE]: "Profile Update",
    [AuditLogAction.CHANGE_PASSWORD]: "Password Change",
    [AuditLogAction.REGENERATE_BACKUP_CODE]: "Backup Code Regenerated",
    [AuditLogAction.ENABLE_MFA]: "Two-Factor Authentication Enabled",
    [AuditLogAction.DISABLE_MFA]: "Two-Factor Authentication Disabled",
    [AuditLogAction.GET_MFA_STATUS]:
      "Two-Factor Authentication Status Retrieved",
    [AuditLogAction.REGISTER_PASSKEY]: "Passkey Registered",
    [AuditLogAction.UNREGISTER_PASSKEY]: "Passkey Removed",
    [AuditLogAction.DELETE_ACCOUNT]: "Account Deletion",
  };
  return actionMap[action] || action;
};

const getUserLoginMethodDisplayName = (method: AuditLogMethod) => {
  const methodMap: Record<AuditLogMethod, string> = {
    [AuditLogMethod.PASSWORD]: "Password",
    [AuditLogMethod.PASSKEY]: "Passkey",
    [AuditLogMethod.MFA_BACKUP]: "Backup Code",
    [AuditLogMethod.MFA]: "MFA Code",
  };
  return methodMap[method] || method;
};

const getUserDeviceInfoString = (userAgent: string) => {
  if (!userAgent) return "Unknown Device";
  const { deviceName, deviceOS } = getDeviceInfoFromUA();
  return `${deviceName} on ${deviceOS}`;
};

const getUserActionColor = (action: AuditLogAction, success?: boolean) => {
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
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "success" | "failed">(
    "all"
  );

  const filteredLogs = logs.filter((log) => {
    if (filterType === "success") return log.success === true;
    if (filterType === "failed") return log.success === false;
    return true;
  });

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

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
      setExpandedLog(null);
      setFilterType("all");
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
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 rounded-lg shadow-xl">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-4 pb-3 border-b bg-gradient-to-r from-card to-card/50">
          <div className="space-y-3">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Account Activity
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Monitor your account&apos;s events and login history
                </DialogDescription>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex justify-center">
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
                {[
                  { key: "all", label: "All" },
                  { key: "success", label: "Success" },
                  { key: "failed", label: "Failed" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key as typeof filterType)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      filterType === key
                        ? "bg-background text-foreground shadow-sm border"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Unable to Load Activity
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {error}
              </p>
            </div>
          ) : filteredLogs.length === 0 && isLoading ? (
            <div className="space-y-3 p-4 h-full overflow-y-auto hide-scrollbar">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-card/30"
                >
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center max-w-sm">
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-xl bg-muted/50 mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {filterType === "all"
                    ? "No Account Activity"
                    : `No ${filterType} Activities`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filterType === "all"
                    ? "Your account activity will appear here"
                    : `No ${filterType} account activities found`}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="h-full p-4 space-y-3 overflow-y-auto hide-scrollbar"
              onScroll={handleScroll}
            >
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const actionName = getUserActionDisplayName(log.action);
                const relativeTime = getRelativeTime(new Date(log.at));
                const deviceInfo = getUserDeviceInfoString(log.userAgent || "");
                const colorScheme = getUserActionColor(log.action, log.success);
                const isExpanded = expandedLog === log.id;

                return (
                  <div
                    key={log.id}
                    className="border rounded-lg bg-card/50 hover:bg-card/80 transition-all hover:shadow-md"
                  >
                    {/* Main Content */}
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0 ${
                            log.success === false
                              ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              : colorScheme === "green"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                              : colorScheme === "orange"
                              ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                              : colorScheme === "blue"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          <ActionIcon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title Row */}
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <h4 className="text-base font-semibold text-foreground truncate">
                                {actionName}
                              </h4>
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  log.success === false
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                }`}
                              >
                                {log.success === false ? (
                                  <XCircle className="h-3 w-3" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {log.success === false ? "Failed" : "Success"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {relativeTime}
                              </span>
                              <button
                                onClick={() => toggleLogExpansion(log.id)}
                                className="p-1 rounded-md hover:bg-muted/50 transition-all"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {log.method && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border">
                                <Key className="h-3 w-3" />
                                <span>
                                  {getUserLoginMethodDisplayName(log.method)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="font-mono">{log.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/10 p-4 space-y-4">
                        {log.details && (
                          <div>
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Details
                            </h5>
                            <p className="text-sm text-foreground bg-background/50 p-3 rounded-lg border">
                              {log.details}
                            </p>
                          </div>
                        )}

                        {log.errorMessage && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                                Error Message
                              </h5>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {log.errorMessage}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                          <div>
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Timestamp
                            </h5>
                            <p className="text-sm text-foreground font-mono bg-background/50 px-2 py-1 rounded border">
                              {new Date(log.at).toLocaleString()}
                            </p>
                          </div>
                          {log.userAgent && (
                            <div>
                              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Device
                              </h5>
                              <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded border">
                                <Monitor className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm text-foreground truncate">
                                  {deviceInfo}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50 border">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">
                      Loading more activity...
                    </span>
                  </div>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && filteredLogs.length > 0 && (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
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
