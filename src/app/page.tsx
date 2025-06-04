"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { User, LogIn, UserPlus, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { formatTime, formatDate } from "@/utils/formatters";
import { LogoutDialog } from "@/components/dialogs/LogoutDialog";

function HomePageSkeleton() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full p-6 rounded-lg bg-card border shadow-md mb-4 relative">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
              <Skeleton className="w-7 h-7 rounded" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <Skeleton className="h-7 w-48 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>

                <div className="hidden sm:block text-right space-y-0.5 mt-2 sm:mt-0">
                  <Skeleton className="h-8 w-32 rounded-md ml-auto" />
                  <Skeleton className="h-4 w-24 rounded-md ml-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full p-6 rounded-lg bg-card border shadow-md">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-md" />

            <div className="flex items-center gap-2">
              <span className="flex-1 h-px bg-muted-foreground/20" />
              <Skeleton className="h-4 w-6 rounded" />
              <span className="flex-1 h-px bg-muted-foreground/20" />
            </div>

            <Skeleton className="h-10 w-full rounded-md" />

            <div className="text-center pt-2">
              <Skeleton className="h-3 w-72 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [timeState, setTimeState] = useState<{
    baseTime: Date | null;
    offset: number;
    isReady: boolean;
  }>({
    baseTime: null,
    offset: 0,
    isReady: false,
  });

  useEffect(() => {
    if (!authLoading) {
      const syncTime = () => {
        setTimeState({
          baseTime: new Date(),
          offset: 0,
          isReady: true,
        });
      };

      syncTime();

      const syncInterval = setInterval(syncTime, 15000);

      let frameId: number;

      const updateFrame = () => {
        setTimeState((prev) => {
          if (!prev.baseTime) return prev;
          const now = Date.now();
          const offset = now - prev.baseTime.getTime();
          return { ...prev, offset };
        });
        frameId = requestAnimationFrame(updateFrame);
      };

      frameId = requestAnimationFrame(updateFrame);

      return () => {
        clearInterval(syncInterval);
        if (frameId) cancelAnimationFrame(frameId);
      };
    }
  }, [authLoading]);

  const getCurrentTime = () => {
    if (!timeState.baseTime || !timeState.isReady) return null;
    const milliseconds = timeState.baseTime.getTime() + timeState.offset;
    return new Date(milliseconds);
  };

  if (authLoading) {
    return <HomePageSkeleton />;
  }

  const currentTime = getCurrentTime();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full p-6 rounded-lg bg-card border shadow-md mb-4 relative">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center">
              <User className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-foreground">
                    {user
                      ? `Hello, ${user.name.split(" ")[0]}!`
                      : "Hello, Welcome!"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {user
                      ? "Nice to see you back"
                      : "Sign in to continue to your account"}
                  </p>
                </div>

                <div className="hidden sm:block text-right space-y-0.5 mt-2 sm:mt-0">
                  {currentTime ? (
                    <>
                      <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                        {formatTime(currentTime)}
                      </div>
                      <div
                        className="text-xs sm:text-sm text-muted-foreground tracking-tight"
                        dangerouslySetInnerHTML={{
                          __html: formatDate(currentTime, false),
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-8 w-32 rounded-md ml-auto" />
                      <Skeleton className="h-4 w-24 rounded-md ml-auto" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full p-6 rounded-lg bg-card border shadow-md">
          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <Link href="/myaccount" className="w-full">
                  <Button
                    variant="default"
                    className="w-full h-10 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    My Account
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="flex-1 h-px bg-muted-foreground/20" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <span className="flex-1 h-px bg-muted-foreground/20" />
                </div>

                <LogoutDialog />
              </>
            ) : (
              <>
                <Link href="/login" className="w-full">
                  <Button
                    variant="default"
                    className="w-full h-10 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="flex-1 h-px bg-muted-foreground/20" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <span className="flex-1 h-px bg-muted-foreground/20" />
                </div>

                <Link href="/register" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full h-10 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Button>
                </Link>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    By registering, you agree to our Terms & Conditions and
                    Privacy Policy.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
