import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Trash } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeletePasskeyDialog";
import { getDeviceIcon } from "@/utils/getDeviceIcon";
import type { Passkey } from "@/types/passkey";

interface PasskeyListProps {
  passkeys: Passkey[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  deletingId?: string | null;
  error?: string | null;
  className?: string;
  showPasskeyNameInConfirm?: boolean;
  skeletonCount?: number;
}

export function PasskeyList({
  passkeys,
  isLoading,
  onDelete,
  deletingId,
  error,
  className = "",
  showPasskeyNameInConfirm = false,
  skeletonCount = 3,
}: PasskeyListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDeleteConfirm = async (id: string) => {
    await onDelete(id);
    setConfirmId(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash className="h-6 w-6 text-destructive" />
          </div>
          <p className="mt-3 text-sm font-medium text-destructive">
            Error loading passkeys
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : passkeys.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Smartphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            No passkeys registered
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Register a passkey to enable passwordless authentication
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {passkeys.map((pk) => (
            <div
              key={pk.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                {getDeviceIcon(
                  pk.deviceName ?? "Unkown Device",
                  pk.deviceOS ?? "Unknown OS"
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pk.deviceName || "Unknown Device"}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {pk.deviceOS || "Unknown OS"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {new Date(pk.createdAt).toLocaleDateString()}
                  </span>
                  {pk.registeredIp && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-mono truncate">
                        IP: {pk.registeredIp}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group-hover:opacity-100 sm:opacity-0 flex-shrink-0"
                onClick={() => setConfirmId(pk.id)}
                disabled={deletingId === pk.id}
                title="Delete passkey"
              >
                {deletingId === pk.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDeleteDialog
          open={!!confirmId}
          onCancel={() => setConfirmId(null)}
          onConfirm={() => handleDeleteConfirm(confirmId)}
          loading={deletingId === confirmId}
          passkeyName={
            showPasskeyNameInConfirm
              ? (() => {
                  const pk = passkeys.find((p) => p.id === confirmId);
                  return pk
                    ? `${pk.deviceName || "Unknown Device"} - ${
                        pk.deviceOS || "Unknown OS"
                      }`
                    : undefined;
                })()
              : undefined
          }
        />
      )}
    </div>
  );
}
