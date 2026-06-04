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

interface TaskListPageProps {
  userRole: UserRole;
  currentUserId?: string;
}

type TabType = "all" | "my" | "overdue" | "upcoming";

export default function TaskListPage({ userRole, currentUserId: propCurrentUserId }: TaskListPageProps) {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
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
        limit: 10,
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

  // Trigger fetch when tab, filters, page or search updates
  useEffect(() => {
    fetchTasks();
  }, [activeTab, statusFilter, priorityFilter, assignedToFilter, sortBy, sortOrder, page]);

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

  const totalPages = Math.ceil(meta.total / meta.limit);
  const isManagerOrAdmin = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListTodo className="h-8 w-8 text-primary" />
            Task Workspace
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage, assign, and organize tasks across your projects.
          </p>
        </div>
        {isManagerOrAdmin && (
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-muted">
        {(["all", "my", "overdue", "upcoming"] as const).map((tab) => {
          const labels = {
            all: "All Tasks",
            my: "Assigned To Me",
            overdue: "Overdue Tasks",
            upcoming: "Upcoming Tasks",
          };

          const activeStyle =
            "border-b-2 border-primary text-primary font-semibold";
          const inactiveStyle =
            "text-muted-foreground hover:text-foreground font-medium";

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2.5 text-sm transition-all focus:outline-none cursor-pointer ${
                activeTab === tab ? activeStyle : inactiveStyle
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 cursor-pointer">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-background border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-background border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Member filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Assignee:</span>
            <select
              value={assignedToFilter}
              onChange={(e) => {
                setAssignedToFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-background border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[140px]"
            >
              <option value="ALL">All Members</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Sort By:</span>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(":");
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
              className="text-xs bg-background border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="createdAt:desc">Latest Created</option>
              <option value="dueDate:asc">Nearest Deadline</option>
              <option value="priority:asc">Highest Priority</option>
              <option value="updatedAt:desc">Recently Updated</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchTasks}
            disabled={isPending}
            className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Task List Grid */}
      {isPending ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCw />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-card border-dashed">
          <ListTodo className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-semibold text-lg text-foreground">No tasks found</p>
          <p className="text-muted-foreground text-sm mt-1">
            Try adjusting your search query or filters.
          </p>
          {(searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
            <Button
              variant="link"
              onClick={handleResetFilters}
              className="mt-2 text-sm text-primary"
            >
              Clear filters
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-muted/80 pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page <span className="font-medium text-foreground">{meta.page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span> ({meta.total} total items)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="h-8 text-xs cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="h-8 text-xs cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
    <div className="flex items-center gap-2 text-muted-foreground">
      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      <span>Loading workspace...</span>
    </div>
  );
}
