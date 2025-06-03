"use client";

import { User } from "@/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UpdateProfileDialog } from "@/components/dialogs/UpdateProfileDialog";
import { User as UserIcon, Mail, AtSign, Calendar } from "lucide-react";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/dialogs/DeleteAccountDialog";
import { LogoutDialog } from "@/components/dialogs/LogoutDialog";
import { AccountInfoSkeleton } from "@/components/sections/account/AccountInfoSkeleton";

interface AccountInfoProps {
  user?: User;
  isLoading?: boolean;
}

export function AccountInfo({ user, isLoading = false }: AccountInfoProps) {
  const [userData, setUserData] = useState<User | undefined>(user);

  const handleUserUpdate = (updatedUser: User) => {
    setUserData(updatedUser);
  };

  if (isLoading || !userData) {
    return <AccountInfoSkeleton />;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 w-full">
          <div className="flex-1 w-full space-y-1">
            <CardTitle
              className="flex items-center gap-2 text-lg sm:text-xl text-foreground"
              title="Account Information"
            >
              <UserIcon className="h-5 w-5" aria-hidden="true" />
              Account Information
            </CardTitle>
            <CardDescription className="text-md sm:text-base">
              Manage your profile and account information
            </CardDescription>
          </div>

          <div className="text-left sm:text-right">
            <div className="flex items-center gap-2 text-base sm:text-sm font-medium text-foreground">
              <Calendar className="h-5 w-5 sm:h-4 sm:w-4" />
              Member since
            </div>
            <CardDescription>
              <span className="text-base sm:text-sm text-muted-foreground">
                {new Date(userData.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </CardDescription>
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
              <p className="text-sm text-foreground bg-muted p-3 rounded-md border border-border break-words">
                {userData.username}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                Full Name
              </Label>
              <p className="text-sm text-foreground bg-muted p-3 rounded-md border border-border break-words">
                {userData.name}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <p className="text-sm text-foreground bg-muted p-3 rounded-md border border-border break-words">
              {userData.email}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          <UpdateProfileDialog
            user={userData}
            onUserUpdate={handleUserUpdate}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <LogoutDialog />
            <DeleteAccountDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
