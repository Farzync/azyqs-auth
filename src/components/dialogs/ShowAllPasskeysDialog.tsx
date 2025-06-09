import React, { useEffect } from "react";
import { usePasskeys } from "@/hooks/usePasskeys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PasskeyList } from "@/components/dialogs/PasskeyListDialog";
import { Shield } from "lucide-react";

export interface ShowAllPasskeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasskeyChanged?: () => void;
}

const ShowAllPasskeysDialog = ({
  open,
  onOpenChange,
  onPasskeyChanged,
}: ShowAllPasskeysDialogProps) => {
  const {
    passkeys,
    isLoading,
    deletingId,
    error,
    fetchPasskeys,
    deletePasskey,
  } = usePasskeys();

  const handleDeletePasskey = async (id: string) => {
    await deletePasskey(id);
    if (onPasskeyChanged) onPasskeyChanged();
  };

  useEffect(() => {
    if (open) fetchPasskeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
              onDelete={handleDeletePasskey}
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
};

export { ShowAllPasskeysDialog };
