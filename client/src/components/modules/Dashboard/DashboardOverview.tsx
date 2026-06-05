"use client";

import { useEffect, useState, useCallback } from "react";
import { getDashboardStats } from "@/services/dashboard/dashboard";
import { getWorkspaceActivities } from "@/services/activity/activity";
import { formatDistanceToNow } from "date-fns";
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
  Activity,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const ChartSkeleton = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-50/10 dark:bg-slate-900/10 animate-pulse rounded-xl py-12">
    <Loader2 className="h-6 w-6 animate-spin text-slate-350 dark:text-slate-650" />
  </div>
);

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
  const [activeSubTab, setActiveSubTab] = useState<"activities" | "deadlines" | "highPriority">(
    "activities"
  );
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState<"chart" | "list">("chart");
  const [activeWorkloadTab, setActiveWorkloadTab] = useState<"chart" | "list">("chart");
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

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const res = await getWorkspaceActivities(1, 5);
      if (res.success && res.data) {
        setRecentActivities(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load recent activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, [fetchStats, fetchActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "TASK_DELETED":
        return <ClipboardList className="h-4 w-4 text-blue-500" />;
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
        return <FolderKanban className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Real-time stats listener
  useEffect(() => {
    if (!socket) return;

    const handleStatsUpdate = () => {
      fetchStats();
    };

    const handleActivityCreated = () => {
      fetchActivities();
    };

    socket.on("stats:updated", handleStatsUpdate);
    socket.on("activity:created", handleActivityCreated);

    return () => {
      socket.off("stats:updated", handleStatsUpdate);
      socket.off("activity:created", handleActivityCreated);
    };
  }, [socket, fetchStats, fetchActivities]);

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

  const CustomYAxisTick = ({ x, y, payload }: any) => {
    return (
      <text
        x={x - 6}
        y={y + 3}
        textAnchor="end"
        fill={isDarkMode ? "#94a3b8" : "#475569"}
        className="text-[10px] font-bold"
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
          title="Overdue Tasks"
          value={overview.overdueTasks || 0}
          iconName="AlertTriangle"
          description="Tasks past deadline"
          iconClassName="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
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
        <div className="bg-card/65 dark:bg-slate-900/50 backdrop-blur-md text-card-foreground border border-border/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            Task Status & Priority Breakdown
          </h3>

          {!isMounted ? (
            <ChartSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-center flex-1">
              {/* Doughnut Chart for Status */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Status Distribution
                </span>
                {(() => {
                  const statusData = [
                    { name: "To Do", value: statusAnalytics.todo, color: "#f59e0b" },
                    { name: "In Progress", value: statusAnalytics.inProgress, color: "#3b82f6" },
                    { name: "Completed", value: statusAnalytics.completed, color: "#10b981" },
                  ];
                  const totalStatusTasks = statusAnalytics.todo + statusAnalytics.inProgress + statusAnalytics.completed;
                  const statusChartData = totalStatusTasks > 0
                    ? statusData
                    : [{ name: "No Tasks", value: 1, color: isDarkMode ? "#334155" : "#e2e8f0" }];

                  return (
                    <div className="w-full flex flex-col items-center">
                      <div className="relative flex items-center justify-center h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={totalStatusTasks > 0 ? 4 : 0}
                              dataKey="value"
                            >
                              {statusChartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            {totalStatusTasks > 0 && (
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                                  borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
                                  borderRadius: "8px",
                                  color: isDarkMode ? "#f8fafc" : "#0f172a",
                                }}
                              />
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                            {totalStatusTasks}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Tasks
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
                        {statusData.map((item, index) => (
                          <div key={index} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span>{item.name}: <span className="font-extrabold text-slate-700 dark:text-slate-350">{item.value}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Pie Chart for Priority */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Priority Distribution
                </span>
                {(() => {
                  const priorityData = [
                    { name: "Low", value: priorityAnalytics.low, color: "#94a3b8" },
                    { name: "Medium", value: priorityAnalytics.medium, color: "#f59e0b" },
                    { name: "High", value: priorityAnalytics.high, color: "#f43f5e" },
                  ];
                  const totalPriorityTasks = priorityAnalytics.low + priorityAnalytics.medium + priorityAnalytics.high;
                  const priorityChartData = totalPriorityTasks > 0
                    ? priorityData
                    : [{ name: "No Tasks", value: 1, color: isDarkMode ? "#334155" : "#e2e8f0" }];

                  return (
                    <div className="w-full flex flex-col items-center">
                      <div className="relative flex items-center justify-center h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={priorityChartData}
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              paddingAngle={totalPriorityTasks > 0 ? 2 : 0}
                              dataKey="value"
                            >
                              {priorityChartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            {totalPriorityTasks > 0 && (
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                                  borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
                                  borderRadius: "8px",
                                  color: isDarkMode ? "#f8fafc" : "#0f172a",
                                }}
                              />
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
                        {priorityData.map((item, index) => (
                          <div key={index} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span>{item.name}: <span className="font-extrabold text-slate-700 dark:text-slate-350">{item.value}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="bg-card/65 dark:bg-slate-900/50 backdrop-blur-md text-card-foreground border border-border/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FolderKanban className="h-4.5 w-4.5 text-primary" />
              Project Progress Summary
            </h3>
            <div className="flex bg-muted rounded-lg p-0.5 border border-border/40">
              <button
                onClick={() => setActiveProjectTab("chart")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${activeProjectTab === "chart"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Chart
              </button>
              <button
                onClick={() => setActiveProjectTab("list")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${activeProjectTab === "list"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                List
              </button>
            </div>
          </div>

          {activeProjectTab === "chart" ? (
            <div className="flex-1 min-h-[295px] flex items-center justify-center">
              {!isMounted ? (
                <ChartSkeleton />
              ) : projectProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-10">
                  <FolderKanban className="h-8 w-8 mb-2" />
                  <p className="text-xs">No active projects found</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    layout="vertical"
                    data={projectProgress.map((p: any) => ({
                      name: p.name.length > 20 ? `${p.name.substring(0, 20)}...` : p.name,
                      fullName: p.name,
                      progress: p.progress,
                    }))}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="projectProgressGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={isDarkMode ? "#a78bfa" : "#818cf8"} />
                        <stop offset="100%" stopColor={isDarkMode ? "#6d28d9" : "#4f46e5"} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke={isDarkMode ? "#1e293b" : "#f1f5f9"}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      unit="%"
                      stroke={isDarkMode ? "#64748b" : "#94a3b8"}
                      className="text-[10px] font-bold"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      stroke={isDarkMode ? "#64748b" : "#94a3b8"}
                      tickLine={false}
                      axisLine={false}
                      tick={<CustomYAxisTick />}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, "Progress"]}
                      contentStyle={{
                        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                        borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
                        borderRadius: "8px",
                        color: isDarkMode ? "#f8fafc" : "#0f172a",
                      }}
                    />
                    <Bar dataKey="progress" fill="url(#projectProgressGrad)" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* 3. Team Workloads and Task Action Center */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Workload */}
        <div className="bg-card/65 dark:bg-slate-900/50 backdrop-blur-md text-card-foreground border border-border/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-primary" />
              Member Workload Summary
            </h3>
            <div className="flex bg-muted rounded-lg p-0.5 border border-border/40">
              <button
                onClick={() => setActiveWorkloadTab("chart")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${activeWorkloadTab === "chart"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Chart
              </button>
              <button
                onClick={() => setActiveWorkloadTab("list")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${activeWorkloadTab === "list"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Table
              </button>
            </div>
          </div>

          {activeWorkloadTab === "chart" ? (
            <div className="flex-1 min-h-[350px] flex items-center justify-center">
              {!isMounted ? (
                <ChartSkeleton />
              ) : memberWorkload.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-10">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-xs">No team members workload to show</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={memberWorkload.map((mw: any) => ({
                      name: mw.name.split(" ")[0],
                      fullName: mw.name,
                      Completed: mw.completedTasks,
                      Pending: mw.pendingTasks,
                    }))}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDarkMode ? "#1e293b" : "#f1f5f9"}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDarkMode ? "#64748b" : "#94a3b8"}
                      className="text-[10px] font-bold"
                    />
                    <YAxis
                      stroke={isDarkMode ? "#64748b" : "#94a3b8"}
                      className="text-[10px] font-bold"
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                        borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
                        borderRadius: "8px",
                        color: isDarkMode ? "#f8fafc" : "#0f172a",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" barSize={16} />
                    <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
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
                  <tbody className="divide-y divide-slate-50 dark:divide-primary/20">
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
          )}
        </div>

        {/* Recent Activities & Task Action (Tabs) */}
        <div className="bg-card/65 dark:bg-slate-900/50 backdrop-blur-md text-card-foreground border border-border/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 mb-5 gap-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
              Recent Activities & Task Action
            </h3>
            <div className="flex bg-muted rounded-lg p-0.5 self-start sm:self-auto">
              <button
                onClick={() => setActiveSubTab("activities")}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeSubTab === "activities"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Recent Activities
              </button>
              <button
                onClick={() => setActiveSubTab("deadlines")}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeSubTab === "deadlines"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Deadlines
              </button>
              <button
                onClick={() => setActiveSubTab("highPriority")}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeSubTab === "highPriority"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                High Priority
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[330px] pr-1">
            {activeSubTab === "activities" ? (
              loadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                  <Activity className="h-8 w-8 mb-2" />
                  <p className="text-xs">No recent activities found</p>
                </div>
              ) : (
                recentActivities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="border dark:border-primary/20 rounded-xl p-3 transition-all hover:border-primary/35 flex items-start gap-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                        <span className="font-extrabold text-slate-850 dark:text-slate-100 mr-1">
                          {activity.user?.name || "System"}
                        </span>
                        {activity.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )
            ) : activeSubTab === "deadlines" ? (
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
                      className="border dark:border-primary/20 rounded-xl p-3.5 hover:border-primary/40 dark:hover:border-primary/40 cursor-pointer transition-all hover:translate-x-1 flex items-start gap-3.5"
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
                  className="border dark:border-primary/20 rounded-xl p-3.5 hover:border-primary/40 dark:hover:border-primary/40 cursor-pointer transition-all hover:translate-x-1 flex items-start gap-3.5"
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
