"use client";

import { useEffect, useState, useTransition } from "react";
import { getWorkspaceActivities } from "@/services/activity/activity";
import { Activity, Clock, Folder, CheckSquare, MessageSquare, Paperclip, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WorkspaceActivities = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchActivities(page, limit);
  }, [page, limit]);

  const fetchActivities = (pageNumber: number, limitNumber: number) => {
    setLoading(true);
    startTransition(async () => {
      const response = await getWorkspaceActivities(pageNumber, limitNumber);
      if (response.success && response.data) {
        setActivities(response.data.data);
        setMeta(response.data.meta);
      }
      setLoading(false);
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "TASK_DELETED":
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "COMMENT_CREATED":
      case "COMMENT_UPDATED":
      case "COMMENT_DELETED":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "ATTACHMENT_UPLOADED":
      case "ATTACHMENT_DELETED":
        return <Paperclip className="h-4 w-4 text-purple-500" />;
      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
      case "PROJECT_DELETED":
        return <Folder className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getActivityColorClass = (type: string) => {
    switch (type) {
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
        return "bg-blue-50/50 dark:bg-blue-950/20 border-blue-150 dark:border-blue-900/40";
      case "COMMENT_CREATED":
      case "COMMENT_UPDATED":
        return "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/40";
      case "ATTACHMENT_UPLOADED":
        return "bg-purple-50/50 dark:bg-purple-950/20 border-purple-150 dark:border-purple-900/40";
      case "TASK_DELETED":
      case "PROJECT_DELETED":
      case "COMMENT_DELETED":
      case "ATTACHMENT_DELETED":
        return "bg-rose-50/50 dark:bg-rose-950/20 border-rose-150 dark:border-rose-900/40";
      default:
        return "bg-slate-50/50 dark:bg-slate-900/40 border-border dark:border-slate-700/60";
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activities Feed</h1>
        <p className="text-muted-foreground text-sm">
          Keep track of everything happening across your workspace projects and tasks.
        </p>
      </div>

      {/* Main activities timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-card text-muted-foreground">
          <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No activity logs recorded yet.</p>
        </div>
      ) : (
        <div className="bg-card/65 dark:bg-slate-900/50 backdrop-blur-md border border-border dark:border-slate-700/60 rounded-2xl p-6 shadow-2xs">
          <div className="relative border-l-2 border-border dark:border-slate-800 ml-4 space-y-8 py-2">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-8 group">
                {/* Timeline Dot Indicator */}
                <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-card dark:bg-slate-950 border-2 border-border dark:border-slate-700/60 group-hover:border-primary transition-colors">
                  {getActivityIcon(activity.type)}
                </span>

                {/* Activity Card */}
                <div className={`p-4 rounded-xl border ${getActivityColorClass(activity.type)} transition-all duration-200 shadow-2xs`}>
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    {/* User and Message */}
                    <div className="text-sm">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 mr-1.5">
                        {activity.user?.name || "System"}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {activity.message}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 mt-1 md:mt-0 font-medium">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Meta project / task context */}
                  {(activity.project || activity.task) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-border dark:border-slate-800/80 text-xs text-slate-500">
                      {activity.project && (
                        <div className="flex items-center gap-1 bg-card/40 dark:bg-slate-950/40 border border-border dark:border-slate-700/60 rounded-md px-2 py-0.5 font-semibold">
                          <Folder className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Project: {activity.project.name}</span>
                        </div>
                      )}
                      {activity.task && (
                        <div className="flex items-center gap-1 bg-card/40 dark:bg-slate-950/40 border border-border dark:border-slate-700/60 rounded-md px-2 py-0.5 font-semibold">
                          <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                          <span>Task: {activity.task.title}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
            const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
            const to = Math.min(meta.page * meta.limit, meta.total);

            return (
              !isPending && activities.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border dark:border-slate-700/60 pt-5 mt-6 gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing <span className="font-bold text-foreground">{from}</span> to <span className="font-bold text-foreground">{to}</span> of{" "}
                      <span className="font-bold text-foreground">{meta.total}</span> ({totalPages} {totalPages === 1 ? "page" : "pages"})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Rows per page:</span>
                      <Select
                        value={meta.limit.toString()}
                        onValueChange={(val) => handleLimitChange(Number(val))}
                      >
                        <SelectTrigger className="w-[70px] h-8 bg-background border-border dark:border-slate-800 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 20, 50, 100].map((size) => (
                            <SelectItem key={size} value={size.toString()} className="text-xs cursor-pointer">
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-2.5 border border-border dark:border-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 cursor-pointer"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>

                    {(() => {
                      const getPageNumbers = () => {
                        const pages = [];
                        const maxVisiblePages = 5;

                        if (totalPages <= maxVisiblePages + 2) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);

                          if (page > 3) {
                            pages.push("...");
                          }

                          const start = Math.max(2, page - 1);
                          const end = Math.min(totalPages - 1, page + 1);

                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }

                          if (page < totalPages - 2) {
                            pages.push("...");
                          }

                          pages.push(totalPages);
                        }
                        return pages;
                      };

                      return getPageNumbers().map((pageNum, idx) => {
                        if (pageNum === "...") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1.5 text-xs text-muted-foreground select-none"
                            >
                              ...
                            </span>
                          );
                        }

                        const isCurrent = pageNum === page;
                        return (
                          <Button
                            key={`page-${pageNum}`}
                            variant={isCurrent ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 text-xs p-0 border border-border dark:border-slate-800 font-semibold cursor-pointer ${
                              isCurrent
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "hover:bg-muted dark:hover:bg-slate-800/80"
                            }`}
                            onClick={() => setPage(Number(pageNum))}
                          >
                            {pageNum}
                          </Button>
                        );
                      });
                    })()}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-2.5 border border-border dark:border-slate-800 hover:bg-muted dark:hover:bg-slate-800/80 cursor-pointer"
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default WorkspaceActivities;
