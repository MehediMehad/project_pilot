"use client";

import { useEffect, useState, useTransition } from "react";
import { getWorkspaceActivities } from "@/services/activity/activity";
import { Activity, Clock, Folder, CheckSquare, MessageSquare, Paperclip, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const WorkspaceActivities = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchActivities(meta.page);
  }, [meta.page]);

  const fetchActivities = (pageNumber: number) => {
    setLoading(true);
    startTransition(async () => {
      const response = await getWorkspaceActivities(pageNumber, 10);
      if (response.success && response.data) {
        setActivities(response.data.data);
        setMeta(response.data.meta);
      }
      setLoading(false);
    });
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
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50";
      case "COMMENT_CREATED":
      case "COMMENT_UPDATED":
        return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50";
      case "ATTACHMENT_UPLOADED":
        return "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50";
      case "TASK_DELETED":
      case "PROJECT_DELETED":
      case "COMMENT_DELETED":
      case "ATTACHMENT_DELETED":
        return "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50";
      default:
        return "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
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
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 py-2">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-8 group">
                {/* Timeline Dot Indicator */}
                <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 group-hover:border-primary transition-colors">
                  {getActivityIcon(activity.type)}
                </span>

                {/* Activity Card */}
                <div className={`p-4 rounded-xl border ${getActivityColorClass(activity.type)} transition-all duration-200 shadow-2xs`}>
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    {/* User and Message */}
                    <div className="text-sm">
                      <span className="font-extrabold text-slate-850 dark:text-slate-150 mr-1.5">
                        {activity.user?.name || "System"}
                      </span>
                      <span className="text-slate-650 dark:text-slate-350">
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
                    <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-500">
                      {activity.project && (
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md px-2 py-0.5 font-semibold">
                          <Folder className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Project: {activity.project.name}</span>
                        </div>
                      )}
                      {activity.task && (
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md px-2 py-0.5 font-semibold">
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-5 mt-6">
              <span className="text-xs text-slate-500 font-bold">
                Page {meta.page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  disabled={meta.page <= 1}
                  onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  disabled={meta.page >= totalPages}
                  onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceActivities;
