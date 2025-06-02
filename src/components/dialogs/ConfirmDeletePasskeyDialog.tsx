import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  passkeyName?: string;
}

export function ConfirmDeleteDialog({
  open,
  onConfirm,
  onCancel,
  loading,
  passkeyName,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(128,128,128,0.15)] dark:bg-[rgba(120,120,120,0.25)] rounded-lg cursor-not-allowed" />
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Confirm Delete Passkey
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete this passkey?
            <strong className="text-destructive">
              {" "}
              This action cannot be undone.
            </strong>
          </DialogDescription>
        </DialogHeader>

        {passkeyName && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              Passkey to delete:
            </p>
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
              <p className="font-mono text-sm text-foreground break-all">
                {passkeyName}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting Passkey...
              </>
            ) : (
              <>
                <TriangleAlert className="h-4 w-4" />
                Delete Passkey
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
