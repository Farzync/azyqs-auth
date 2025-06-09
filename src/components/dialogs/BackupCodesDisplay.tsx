"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React from "react";

interface BackupCodesDisplayProps {
  codes: string[];
  onDownload?: () => void;
  isLoading?: boolean;
  userLoading?: boolean;
  downloadLabel?: string;
  infoText?: React.ReactNode;
  onDone?: () => void;
  doneLabel?: string;
}

export function BackupCodesDisplay({
  codes,
  onDownload,
  userLoading = false,
  downloadLabel = "Download Backup Codes",
  infoText = (
    <>
      Please save these backup codes in a safe place. Each code can only be used
      once if you lose access to your MFA app.
      <br />
      <span className="font-semibold text-destructive">
        Don&apos;t share the code with anyone!{" "}
      </span>
      <br />
      <span className="text-xs text-muted-foreground">
        Format: 8 uppercase letters or numbers (A-Z, 0-9)
      </span>
    </>
  ),
  onDone,
  doneLabel = "Done",
}: BackupCodesDisplayProps) {
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <p className="text-sm text-muted-foreground text-center">{infoText}</p>
      <div className="grid grid-cols-2 gap-2 bg-muted/50 border border-border rounded-md p-4 justify-center">
        {codes.map((code, idx) => (
          <div
            key={idx}
            className="font-mono text-base text-center bg-card rounded px-2 py-1 border border-border text-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {idx + 1}. {code.replace(/[^A-Z0-9]/g, "")}
          </div>
        ))}
      </div>
      {onDownload && (
        <Button
          variant="outline"
          onClick={onDownload}
          className="w-full flex items-center gap-2"
          disabled={userLoading}
        >
          {userLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {downloadLabel}
            </>
          )}
        </Button>
      )}
      {onDone && (
        <Button className="w-full mt-2" onClick={onDone}>
          {doneLabel}
        </Button>
      )}
    </div>
  );
}
