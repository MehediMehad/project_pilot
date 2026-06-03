"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/contexts/SocketContext";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  CheckCircle,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  Briefcase,
  Wifi,
  WifiOff,
} from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "TASK_ASSIGNED":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <UserPlus className="h-4 w-4" />
        </div>
      );
    case "TASK_UPDATED":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle className="h-4 w-4" />
        </div>
      );
    case "COMMENT_ADDED":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <MessageSquare className="h-4 w-4" />
        </div>
      );
    case "DEADLINE_REMINDER":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    case "PROJECT_UPDATED":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Briefcase className="h-4 w-4" />
        </div>
      );
    default:
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
          <Bell className="h-4 w-4" />
        </div>
      );
  }
};

export default function NotificationDropdown() {
  const { notifications, unreadCount, isConnected, markAllAsRead, markAsRead } =
    useSocket();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative cursor-pointer transition-all hover:bg-slate-100">
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {/* Connection status indicator */}
          <span
            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            }`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1 shadow-xl border border-slate-100 rounded-xl">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">Notifications</span>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-500 hover:bg-red-500 text-white rounded-md">
                {unreadCount} new
              </Badge>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-primary hover:text-primary-hover hover:bg-primary/5 cursor-pointer font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Read all
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3 text-slate-400">
                <Bell className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-sm font-medium text-slate-800">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                {isConnected
                  ? "You'll see real-time updates and task activities here."
                  : "Connecting to real-time notification server..."}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification, index) => (
                <DropdownMenuItem
                  key={`${notification.timestamp}-${index}`}
                  onClick={async (e) => {
                    if (notification.id && !notification.isRead) {
                      await markAsRead(notification.id);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 my-0.5 mx-1 rounded-lg cursor-pointer transition-all hover:bg-slate-50 border-l-2 ${
                    !notification.isRead
                      ? "bg-slate-50/50 border-l-primary"
                      : "border-l-transparent text-slate-600"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold leading-normal truncate ${!notification.isRead ? "text-slate-800" : "text-slate-600"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
