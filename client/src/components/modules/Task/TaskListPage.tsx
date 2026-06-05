"use client";

import { useEffect, useState, useTransition } from "react";
import { UserRole } from "@/lib/auth/auth-utils";
import { ITask, TaskPriority, TaskStatus, IUser } from "@/types";
import {
  getAllTasks,
  getMyTasks,
  getOverdueTasks,
  getUpcomingTasks,
} from "@/services/task/taskManagement";
import { getAllUsers } from "@/services/admin/userManagement";
import TaskCard from "./TaskCard";
import TaskFormDialog from "./TaskFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
import { getUserInfo } from "@/services/auth/user-info.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskListPageProps {
  userRole: UserRole;
  currentUserId?: string;
}

type TabType = "all" | "my" | "overdue" | "upcoming";

export default function TaskListPage({ userRole, currentUserId: propCurrentUserId }: TaskListPageProps) {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 9, total: 0 });
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(propCurrentUserId);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    if (!currentUserId) {
      getUserInfo().then((user) => {
        if (user?.id) {
          setCurrentUserId(user.id);
        }
      });
    }
  }, [currentUserId, propCurrentUserId]);

  // Fetch all users on mount for member filter
  useEffect(() => {
    getAllUsers({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setUsers(res.data.data);
      }
    });
  }, []);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);

  const [isPending, startTransition] = useTransition();

  const fetchTasks = () => {
    startTransition(async () => {
      const params = {
        searchTerm: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        assignedToId: assignedToFilter !== "ALL" ? assignedToFilter : undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      };

      let res;
      if (activeTab === "all") {
        res = await getAllTasks(params);
      } else if (activeTab === "my") {
        res = await getMyTasks(params);
      } else if (activeTab === "overdue") {
        res = await getOverdueTasks(params);
      } else {
        res = await getUpcomingTasks(params);
      }

      if (res.success && res.data) {
        setTasks(res.data.data);
        setMeta(res.data.meta);
      } else {
        setTasks([]);
      }
    });
  };

  // Trigger fetch when tab, filters, page, limit or search updates
  useEffect(() => {
    fetchTasks();
  }, [activeTab, statusFilter, priorityFilter, assignedToFilter, sortBy, sortOrder, page, limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAssignedToFilter("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  const isManagerOrAdmin = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <ListTodo className="h-8 w-8 text-primary" />
            Task Workspace
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1.5">
            Manage, assign, and organize tasks across your projects.
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-1.5 self-start sm:self-auto cursor-pointer rounded-xl font-bold px-4 py-5 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
        {(["all", "my", "overdue", "upcoming"] as const).map((tab) => {
          const labels = {
            all: "All Tasks",
            my: "Assigned To Me",
            overdue: "Overdue Tasks",
            upcoming: "Upcoming Tasks",
          };

          const activeStyle =
            "border-b-2 border-primary text-primary font-extrabold dark:text-primary";
          const inactiveStyle =
            "text-muted-foreground hover:text-foreground font-semibold";

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-4 py-3 text-sm transition-all focus:outline-none cursor-pointer shrink-0 ${
                activeTab === tab ? activeStyle : inactiveStyle
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-card/65 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-border/70 dark:border-slate-800/80 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 w-full xl:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 h-10 bg-muted/40 dark:bg-slate-950/40 border-border/60 dark:border-slate-800/60 rounded-xl"
            />
          </div>
          <Button type="submit" className="h-10 px-5 rounded-xl cursor-pointer font-bold">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs bg-muted/40 dark:bg-slate-950/40 border-border/60 dark:border-slate-800/60 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Priority:</span>
            <Select
              value={priorityFilter}
              onValueChange={(value) => {
                setPriorityFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] h-9 text-xs bg-muted/40 dark:bg-slate-950/40 border-border/60 dark:border-slate-800/60 rounded-xl">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Assignee:</span>
            <Select
              value={assignedToFilter}
              onValueChange={(value) => {
                setAssignedToFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/40 dark:bg-slate-950/40 border-border/60 dark:border-slate-800/60 rounded-xl">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Members</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Sort By:</span>
            <Select
              value={`${sortBy}:${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split(":");
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[155px] h-9 text-xs bg-muted/40 dark:bg-slate-950/40 border-border/60 dark:border-slate-800/60 rounded-xl">
                <SelectValue placeholder="Latest Created" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Latest Created</SelectItem>
                <SelectItem value="dueDate:asc">Nearest Deadline</SelectItem>
                <SelectItem value="priority:asc">Highest Priority</SelectItem>
                <SelectItem value="updatedAt:desc">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto xl:ml-0">
            {(searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL" || assignedToFilter !== "ALL") && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl hover:bg-muted/30"
              >
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTasks}
              disabled={isPending}
              className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl bg-muted/30 dark:bg-slate-950/30 border border-border/60 dark:border-slate-800/60"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Task List Grid */}
      {isPending ? (
        <div className="flex items-center justify-center py-24">
          <LoaderCw />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/80 dark:border-slate-800/80 rounded-2xl bg-card/40 dark:bg-slate-900/20 backdrop-blur-md">
          <ListTodo className="h-12 w-12 text-muted-foreground mb-4 opacity-80" />
          <p className="font-bold text-lg text-foreground">No tasks found</p>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm text-center">
            Try adjusting your search query or filters to find what you are looking for.
          </p>
          {(searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL" || assignedToFilter !== "ALL") && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 text-xs font-bold rounded-xl px-4 py-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                userRole={userRole}
                currentUserId={currentUserId}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsDialogOpen(true);
                }}
                onDeleteSuccess={fetchTasks}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {!isPending && tasks.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border/60 dark:border-slate-800/60 pt-5 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{from}</span> to <span className="font-bold text-foreground">{to}</span> of{" "}
                  <span className="font-bold text-foreground">{meta.total}</span> ({totalPages} {totalPages === 1 ? "page" : "pages"})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Rows per page:</span>
                  <Select
                    value={meta.limit.toString()}
                    onValueChange={(val) => handleLimitChange(Number(val))}
                  >
                    <SelectTrigger className="w-[70px] h-8 bg-background border-border dark:border-slate-800 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 9, 12, 18, 30].map((size) => (
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
          )}
        </div>
      )}

      {/* Task Creation/Editing Dialog */}
      <TaskFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchTasks}
        task={editingTask}
      />
    </div>
  );
}

function LoaderCw() {
  return (
    <div className="flex items-center gap-3 text-muted-foreground font-bold">
      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      <span>Loading workspace...</span>
    </div>
  );
}
