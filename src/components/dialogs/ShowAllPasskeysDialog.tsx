import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PasskeyList } from "@/components/dialogs/PasskeyListDialog";
import { Shield } from "lucide-react";
import type { Passkey } from "@/types/passkey";

interface ShowAllPasskeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchPasskeys: () => Promise<Passkey[]>;
  onDelete: (id: string) => Promise<void>;
  deletingId?: string | null;
}

export function ShowAllPasskeysDialog({
  open,
  onOpenChange,
  fetchPasskeys,
  onDelete,
  deletingId,
}: ShowAllPasskeysDialogProps) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (open && !hasFetched) {
      setIsLoading(true);
      setError(null);
      fetchPasskeys()
        .then((result) => setPasskeys(result))
        .catch((e) => setError(e?.message || "Failed to load passkeys"))
        .finally(() => {
          setIsLoading(false);
          setHasFetched(true);
        });
    }
    if (!open) {
      setHasFetched(false);
      setPasskeys([]);
      setError(null);
    }
  }, [open, fetchPasskeys, hasFetched]);

  useEffect(() => {
    if (open && hasFetched && !deletingId) {
      setIsLoading(true);
      fetchPasskeys()
        .then((result) => setPasskeys(result))
        .catch((e) => setError(e?.message || "Failed to load passkeys"))
        .finally(() => setIsLoading(false));
    }
  }, [deletingId, open, fetchPasskeys, hasFetched]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            Manage Passkeys
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            View and manage all your registered passkeys. You can delete any
            passkey you no longer use. Hover over a passkey to reveal the delete
            option.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          <div className="h-full overflow-y-auto pr-2 -mr-2">
            <PasskeyList
              passkeys={passkeys}
              isLoading={isLoading}
              onDelete={onDelete}
              deletingId={deletingId}
              error={error}
              showPasskeyNameInConfirm={true}
              skeletonCount={4}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
