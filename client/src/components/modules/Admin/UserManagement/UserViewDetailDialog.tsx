"use client";

import { IUser } from "@/types/user.type";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Mail, Shield, User, Info } from "lucide-react";

interface UserViewDetailDialogProps {
  user: IUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserViewDetailDialog({
  user,
  open,
  onOpenChange,
}: UserViewDetailDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Info className="h-5 w-5 text-primary" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6 border-b">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            {user.profilePhoto ? (
              <AvatarImage
                src={user.profilePhoto}
                alt={user.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">{user.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
              <Shield className="h-3.5 w-3.5" />
              Role
            </span>
            <div>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
              <User className="h-3.5 w-3.5" />
              Status
            </span>
            <div>
              <Badge
                variant="outline"
                className={
                  user.status === "ACTIVE"
                    ? "border-green-600 text-green-700 bg-green-50 dark:bg-green-950/20"
                    : "border-red-600 text-red-700 bg-red-50 dark:bg-red-950/20"
                }
              >
                {user.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
              <Calendar className="h-3.5 w-3.5" />
              Member Since
            </span>
            <p className="text-foreground">
              {format(new Date(user.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
            </p>
          </div>

          <div className="space-y-1 col-span-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
              <Calendar className="h-3.5 w-3.5" />
              Last Updated
            </span>
            <p className="text-foreground">
              {format(new Date(user.updatedAt), "MMMM dd, yyyy 'at' hh:mm a")}
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
