"use client";

import { useEffect, useState, useCallback } from "react";
import { getDashboardStats } from "@/services/dashboard/dashboard";
import { useSocket } from "@/contexts/SocketContext";
import { StatsCard } from "@/components/cards/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TaskDetailsDialog from "../Task/TaskDetailsDialog";
import { ITask } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import {
  FolderKanban,
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  Percent,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";

interface DashboardOverviewProps {
  userRole: UserRole;
  currentUserId?: string;
}

export default function DashboardOverview({
  userRole,
  currentUserId,
}: DashboardOverviewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"deadlines" | "highPriority">(
    "deadlines"
  );
  const { socket } = useSocket();

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time stats listener
  useEffect(() => {
    if (!socket) return;

    const handleStatsUpdate = () => {
      fetchStats();
    };

    socket.on("stats:updated", handleStatsUpdate);

    return () => {
      socket.off("stats:updated", handleStatsUpdate);
    };
  }, [socket, fetchStats]);

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-slate-500">
            Gathering real-time workspace metrics...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/20 text-center p-6">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
        <h3 className="text-lg font-bold text-slate-800">Connection Issue</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Unable to fetch dashboard statistics. Please check your network or try again.
        </p>
        <Button onClick={fetchStats} className="mt-4" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const {
    overview,
    statusAnalytics,
    priorityAnalytics,
    projectProgress,
    memberWorkload,
    upcomingDeadlines,
    highPriorityTasks,
  } = stats;

  return (
    <div className="space-y-6">
      {/* 1. Overview Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Projects"
          value={overview.totalProjects}
          iconName="FolderKanban"
          description="Projects in workspace"
          iconClassName="bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
        />
        <StatsCard
          title="Total Tasks"
          value={overview.totalTasks}
          iconName="ClipboardList"
          description="All tasks created"
          iconClassName="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          title="Completed"
          value={overview.completedTasks}
          iconName="CheckCircle2"
          description="Tasks finished"
          iconClassName="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Pending"
          value={overview.pendingTasks}
          iconName="Clock"
          description="Tasks in progress"
          iconClassName="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Team Members"
          value={overview.totalMembers}
          iconName="Users"
          description="Assigned members"
          iconClassName="bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400"
        />
        <StatsCard
          title="Compliance Rate"
          value={`${overview.complianceRate}%`}
          iconName="Percent"
          description="Completion compliance"
          iconClassName="bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* 2. Status Breakdown and Project Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status & Priority */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            Task Status & Priority Breakdown
          </h3>

          <div className="space-y-6">
            {/* Status Analytics */}
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Statuses
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-slate-300 mb-1.5">
                    <span>To Do</span>
                    <span>{statusAnalytics.todo} tasks</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${
                          overview.totalTasks > 0
                            ? (statusAnalytics.todo / overview.totalTasks) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-slate-300 mb-1.5">
                    <span>In Progress</span>
                    <span>{statusAnalytics.inProgress} tasks</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${
                          overview.totalTasks > 0
                            ? (statusAnalytics.inProgress / overview.totalTasks) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-slate-300 mb-1.5">
                    <span>Completed</span>
                    <span>{statusAnalytics.completed} tasks</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${
                          overview.totalTasks > 0
                            ? (statusAnalytics.completed / overview.totalTasks) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Analytics */}
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Priorities
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Low
                  </span>
                  <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">
                    {priorityAnalytics.low}
                  </div>
                </div>
                <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-amber-555 uppercase tracking-wider">
                    Medium
                  </span>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {priorityAnalytics.medium}
                  </div>
                </div>
                <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                    High
                  </span>
                  <div className="text-xl font-extrabold text-rose-600 mt-1">
                    {priorityAnalytics.high}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <FolderKanban className="h-4.5 w-4.5 text-primary" />
            Project Progress Summary
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[295px] pr-1">
            {projectProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <FolderKanban className="h-8 w-8 mb-2" />
                <p className="text-xs">No active projects found</p>
              </div>
            ) : (
              projectProgress.map((project: any) => (
                <div
                  key={project.id}
                  className="border border-slate-50 dark:border-slate-800/60 rounded-xl p-4 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {project.name}
                    </span>
                    <Badge
                      className={
                        project.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-150 dark:border-green-900/30"
                          : project.status === "ON_HOLD"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-150 dark:border-amber-900/30"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
                      <span>Progress</span>
                      <span>
                        {project.completedTasks}/{project.totalTasks} Tasks ({project.progress}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Team Workloads and Task Action Center */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Workload */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-primary" />
            Member Workload Summary
          </h3>

          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[350px] pr-1">
            {memberWorkload.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <Users className="h-8 w-8 mb-2" />
                <p className="text-xs">No team members workload to show</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-1">Member</th>
                    <th className="pb-3 text-center">Total</th>
                    <th className="pb-3 text-center text-emerald-600">Done</th>
                    <th className="pb-3 text-center text-amber-500">Pending</th>
                    <th className="pb-3 text-right pr-1">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850/50">
                  {memberWorkload.map((mw: any) => {
                    const percentage =
                      mw.totalTasks > 0
                        ? Math.round((mw.completedTasks / mw.totalTasks) * 100)
                        : 0;
                    return (
                      <tr
                        key={mw.id}
                        className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all"
                      >
                        <td className="py-3 pl-1 flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {mw.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                              {mw.name}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1 leading-none truncate max-w-[120px]">
                              {mw.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 text-center font-extrabold text-slate-700 dark:text-slate-300">
                          {mw.totalTasks}
                        </td>
                        <td className="py-3 text-center font-extrabold text-emerald-600">
                          {mw.completedTasks}
                        </td>
                        <td className="py-3 text-center font-extrabold text-amber-500">
                          {mw.pendingTasks}
                        </td>
                        <td className="py-3 text-right pr-1">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              {percentage}%
                            </span>
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-350"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Task Action Center (Tabs) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" />
              Task Action Center
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setActiveSubTab("deadlines")}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  activeSubTab === "deadlines"
                    ? "bg-white dark:bg-slate-950 text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
                }`}
              >
                Deadlines
              </button>
              <button
                onClick={() => setActiveSubTab("highPriority")}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  activeSubTab === "highPriority"
                    ? "bg-white dark:bg-slate-950 text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
                }`}
              >
                High Priority
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[330px] pr-1">
            {activeSubTab === "deadlines" ? (
              upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                  <Calendar className="h-8 w-8 mb-2" />
                  <p className="text-xs">No upcoming deadlines found</p>
                </div>
              ) : (
                upcomingDeadlines.map((task: any) => {
                  const remainingDays = Math.ceil(
                    (new Date(task.dueDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border border-slate-50 dark:border-slate-850 rounded-xl p-3.5 bg-slate-50/20 dark:bg-slate-900/10 hover:border-primary/40 dark:hover:border-primary/40 cursor-pointer transition-all hover:translate-x-1 flex items-start gap-3.5"
                    >
                      <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-primary flex items-center justify-center shrink-0">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Proj: {task.project?.name || "Unscoped"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          className={
                            remainingDays <= 2
                              ? "bg-rose-50 text-rose-700 border-rose-150 hover:bg-rose-50/80"
                              : "bg-amber-50 text-amber-700 border-amber-150 hover:bg-amber-50/80"
                          }
                        >
                          {remainingDays <= 0
                            ? "Overdue"
                            : remainingDays === 1
                              ? "Due Tomorrow"
                              : `In ${remainingDays} Days`}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )
            ) : highPriorityTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="text-xs">No high priority tasks pending</p>
              </div>
            ) : (
              highPriorityTasks.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="border border-slate-50 dark:border-slate-850 rounded-xl p-3.5 bg-slate-50/20 dark:bg-slate-900/10 hover:border-primary/40 dark:hover:border-primary/40 cursor-pointer transition-all hover:translate-x-1 flex items-start gap-3.5"
                >
                  <div className="h-8.5 w-8.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Proj: {task.project?.name || "Unscoped"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className="bg-rose-50 text-rose-700 border-rose-150 hover:bg-rose-50/80">
                      HIGH
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Clickable Task Details Dialog */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          isOpen={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTask(null);
            }
          }}
          userRole={userRole}
          currentUserId={currentUserId}
          onStatusChange={fetchStats}
        />
      )}
    </div>
  );
}
