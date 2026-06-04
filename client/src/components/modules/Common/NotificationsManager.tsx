"use client";

import { useSocket } from "@/contexts/SocketContext";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, CheckCheck, Trash2, Clock, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const NotificationsManager = () => {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    clearNotification,
    clearAllNotifications,
  } = useSocket();

  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "READ") return n.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications Center</h1>
          <p className="text-muted-foreground text-sm">
            View, read, and manage all your real-time activities notifications.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 border border-primary rounded-xl transition-all shadow-2xs"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </button>
            )}
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-rose-500 dark:text-rose-400 rounded-xl transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Clear all logs
            </button>
          </div>
        )}
      </div>

      {/* Main notifications container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* Navigation Filters */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 px-4 py-2.5 gap-2">
          {(["ALL", "UNREAD", "READ"] as const).map((tab) => {
            const count =
              tab === "ALL"
                ? notifications.length
                : tab === "UNREAD"
                  ? unreadCount
                  : notifications.length - unreadCount;

            const isActive = filter === tab;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    : "text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <span className="capitalize">{tab.toLowerCase()}</span>
                {count > 0 && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="text-[9px] px-1.5 py-0 min-w-4 text-center justify-center shrink-0"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* List Content */}
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <BellOff className="h-12 w-12 mb-3 opacity-30 animate-pulse text-primary" />
            <p className="text-sm font-semibold">No notifications found.</p>
            <p className="text-xs text-slate-450 mt-1">
              {filter === "UNREAD"
                ? "You've read all your notifications!"
                : "Your notifications inbox is clean."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-850/50">
            {filteredNotifications.map((notif, index) => {
              const formattedTime = formatDistanceToNow(new Date(notif.timestamp), {
                addSuffix: true,
              });

              return (
                <div
                  key={notif.id || index}
                  className={`p-4 flex gap-4 transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 ${
                    !notif.isRead
                      ? "bg-slate-50/30 dark:bg-slate-900/5 border-l-4 border-primary"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="pt-0.5 shrink-0">
                    {notif.isRead ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-slate-400" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-primary fill-primary/10 cursor-pointer hover:scale-110 transition-transform" onClick={() => notif.id && markAsRead(notif.id)} />
                    )}
                  </div>

                  {/* Message body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-sm ${!notif.isRead ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-350"}`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Right-aligned remove single notification action */}
                      <button
                        onClick={() => clearNotification(index)}
                        className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors shrink-0"
                        title="Dismiss notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-3 font-medium">
                      <Clock className="h-3 w-3" />
                      {formattedTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsManager;
