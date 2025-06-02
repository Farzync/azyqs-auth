"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function UnauthorizedClient() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center bg-background transition-colors">
      <Card className="w-full max-w-md text-center shadow-xl border border-border bg-card/90 dark:bg-card/80 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You don&apos;t have permission to view this page.
          </p>
          <Button asChild className="w-full font-semibold">
            <Link href="/">Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
