"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserIcon, Mail, AtSign, Calendar } from "lucide-react";

export function AccountInfoSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 w-full">
          <div className="flex-1 w-full">
            <CardTitle
              className="flex items-center gap-2 text-lg sm:text-xl text-foreground"
              title="Account Information"
            >
              <UserIcon className="h-5 w-5" aria-hidden="true" />
              Account Information
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Manage your profile and account information
            </CardDescription>
          </div>

          <div className="text-left sm:text-right">
            <div className="flex items-center gap-2 text-base sm:text-sm font-medium text-foreground">
              <Calendar className="h-5 w-5 sm:h-4 sm:w-4" />
              Member since
            </div>
            <div className="mt-1">
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                <AtSign className="h-4 w-4" />
                Username
              </Label>
              <Skeleton className="h-12 w-full rounded-md" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                Full Name
              </Label>
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
