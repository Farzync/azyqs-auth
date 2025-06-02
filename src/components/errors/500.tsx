"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ErrorClient({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center bg-background transition-colors">
      <Card className="w-full max-w-md text-center shadow-xl border border-border bg-card/90 dark:bg-card/80 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            500 - Server Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Something went wrong on our Services. Please try again later.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => reset()}
              className="font-semibold"
            >
              Try Again
            </Button>
            <Button asChild className="font-semibold">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
