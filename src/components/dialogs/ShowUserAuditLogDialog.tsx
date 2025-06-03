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
    [AuditLogMethod.MFA]: "2FA Code",
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
      <DialogContent className="max-w-3xl w-full sm:w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col p-0 rounded-2xl shadow-xl">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b bg-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted shadow">
                <History className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                  Security Activity
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Monitor your account&apos;s security events and login history
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 p-1 bg-card rounded-lg border shadow-sm">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterType === "all"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("success")}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterType === "success"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Success
                </button>
                <button
                  onClick={() => setFilterType("failed")}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterType === "failed"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Failed
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 mb-4 sm:mb-6">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Unable to Load Activity
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md">
                {error}
              </p>
            </div>
          ) : filteredLogs.length === 0 && isLoading ? (
            <div className="space-y-3 p-4 sm:p-6 h-full overflow-y-auto hide-scrollbar">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 sm:gap-4 p-2 sm:p-4 border rounded-xl bg-card/50"
                >
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 sm:h-5 w-24 sm:w-40" />
                      <Skeleton className="h-3 sm:h-4 w-32 sm:w-64" />
                    </div>
                    <Skeleton className="h-3 w-16 sm:w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center h-full flex items-center justify-center p-6 sm:p-8">
              <div>
                <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-muted/50 mb-4 sm:mb-6">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  {filterType === "all"
                    ? "No Security Activity"
                    : `No ${filterType} Activities`}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-sm mx-auto">
                  {filterType === "all"
                    ? "Your security activity will appear here once you start using your account"
                    : `No ${filterType} security activities found`}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="h-full p-2 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto hide-scrollbar"
              onScroll={handleScroll}
              tabIndex={0}
              role="list"
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
                    className="group border rounded-xl bg-card/50 hover:bg-card transition-all duration-200 hover:shadow-md overflow-hidden hide-scrollbar"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-2 sm:p-4">
                      <div
                        className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex-shrink-0 transition-colors ${
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
                        <ActionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-semibold text-foreground truncate">
                              {actionName}
                            </h4>
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 ${
                                log.success === false
                                  ? "bg-red-100 dark:bg-red-900/20"
                                  : "bg-green-100 dark:bg-green-900/20"
                              }`}
                            >
                              {log.success === false ? (
                                <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  log.success === false
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {log.success === false ? "Failed" : "Success"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                              {relativeTime}
                            </span>
                            <button
                              onClick={() => toggleLogExpansion(log.id)}
                              className="p-1 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="sm:hidden mb-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            {relativeTime}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {log.method && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                              <Key className="h-3 w-3" />
                              <span className="font-medium">
                                {getUserLoginMethodDisplayName(log.method)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {log.ipAddress}
                            </span>
                            <span className="sm:hidden">
                              {log.ipAddress.split(".")[0]}...
                              {log.ipAddress.split(".")[3]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-3 sm:p-4 space-y-3">
                        {log.details && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Details
                            </h5>
                            <p className="text-sm text-foreground leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                                Error Message
                              </h5>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {log.errorMessage}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Timestamp
                            </h5>
                            <p className="text-sm text-foreground">
                              {new Date(log.at).toLocaleString()}
                            </p>
                          </div>
                          {log.userAgent && (
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                Device
                              </h5>
                              <div className="flex items-center gap-2">
                                <Monitor className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm text-foreground">
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
              {isLoading && (
                <div className="flex justify-center py-4 sm:py-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Loading more activity...
                    </span>
                  </div>
                </div>
              )}
              {!hasMore && filteredLogs.length > 0 && (
                <div className="text-center py-4 sm:py-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
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
