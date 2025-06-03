import { Label } from "@/components/ui/label";
import { Lock, Eye } from "lucide-react";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";

export function PasswordSection() {
  return (
    <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20 transition-colors hover:bg-muted/30">
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          Password Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Regularly update your password to keep your account secure
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Current Password
        </Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center h-10 px-3 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border font-mono transition-colors hover:bg-muted/70">
            <span className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              ••••••••••••
            </span>
          </div>
          <div className="w-full sm:w-auto">
            <ChangePasswordDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
