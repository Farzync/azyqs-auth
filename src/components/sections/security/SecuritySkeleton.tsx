import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Lock, KeyRound, UserLock, History } from "lucide-react";

export function SecuritySectionSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-sm border border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Password Section Skeleton */}
          <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <div className="flex flex-col sm:flex-row gap-3">
                <Skeleton className="flex-1 h-10 rounded-lg" />
                <Skeleton className="h-10 w-full sm:w-32 rounded-lg" />
              </div>
            </div>
          </div>

          {/* MFA Section Skeleton */}
          <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>

          {/* Passkey Section Skeleton */}
          <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <UserLock className="h-5 w-5 text-muted-foreground" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-8 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>

          {/* Audit Log Section Skeleton */}
          <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-muted/20">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
