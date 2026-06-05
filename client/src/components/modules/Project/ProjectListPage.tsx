"use client";

import { useEffect, useState, useCallback } from "react";
import { IProject, IPaginationMeta } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import { getAllProjects } from "@/services/project/projectManagement";
import ProjectCard from "./ProjectCard";
import ProjectFormDialog from "./ProjectFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/contexts/SocketContext";

interface ProjectListPageProps {
  userRole: UserRole;
  basePath: string; // e.g., "/admin/dashboard/projects"
}

export default function ProjectListPage({
  userRole,
  basePath,
}: ProjectListPageProps) {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [meta, setMeta] = useState<IPaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { socket } = useSocket();

  const canCreate = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllProjects({
        searchTerm,
        status: statusFilter,
        page,
        limit: 12,
        sortBy,
        sortOrder,
      });

      if (res.success) {
        setProjects(res.data.data);
        setMeta(res.data.meta);
      } else {
        toast.error(res.message || "Failed to fetch projects");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    if (!socket) return;

    const handleProjectEvent = () => {
      fetchProjects();
    };

    socket.on("project:added", handleProjectEvent);
    socket.on("project:removed", handleProjectEvent);

    return () => {
      socket.off("project:added", handleProjectEvent);
      socket.off("project:removed", handleProjectEvent);
    };
  }, [socket, fetchProjects]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Projects
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and track your projects in one place.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9 bg-card border-border hover:border-accent focus:border-primary focus:ring-primary rounded-lg text-sm transition-all text-foreground"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Status
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 bg-card text-foreground">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Sort By
            </span>
            <Select
              value={`${sortBy}:${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split(":");
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9 bg-card text-foreground">
                <SelectValue placeholder="Latest Created" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Latest Created</SelectItem>
                <SelectItem value="createdAt:asc">Oldest Created</SelectItem>
                <SelectItem value="deadline:asc">Nearest Deadline</SelectItem>
                <SelectItem value="name:asc">Alphabetical (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

       {/* Projects Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs">
          <div className="flex flex-col items-center gap-2">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm font-medium">Loading projects...</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs gap-3">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-semibold text-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {canCreate
                ? "Create your first project to get started."
                : "You haven't been added to any projects yet."}
            </p>
          </div>
          {canCreate && (
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl gap-2 px-4 py-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Pagination Row */}
      {!loading && projects.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1 pt-4">
          <div className="text-sm text-gray-500 font-medium">
            Showing {from} to {to} of {meta.total}{" "}
            {meta.total === 1 ? "project" : "projects"}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <span className="border border-indigo-600 bg-indigo-50/50 text-indigo-600 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm">
              {meta.page}
            </span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <ProjectFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
