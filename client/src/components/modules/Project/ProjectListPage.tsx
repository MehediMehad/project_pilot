"use client";

import { useEffect, useState } from "react";
import { IProject, IPaginationMeta } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import { getAllProjects } from "@/services/project/projectManagement";
import { deleteProject } from "@/services/project/projectManagement";
import ProjectCard from "./ProjectCard";
import ProjectFormDialog from "./ProjectFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectListPageProps {
  userRole: UserRole;
  basePath: string; // e.g., "/admin/dashboard/projects"
}

export default function ProjectListPage({
  userRole,
  basePath,
}: ProjectListPageProps) {
  const [projects, setProjects] = useState<IProject[]>([]);

  console.log("projects???", projects);

  const [meta, setMeta] = useState<IPaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canCreate = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects({
        searchTerm,
        status: statusFilter,
        page,
        limit: 12,
      });

      console.log("res", res);

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
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, page]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage and track your projects
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-md border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold uppercase">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-md border bg-card text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span>Loading projects...</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-md border bg-card text-muted-foreground gap-3">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium">No projects found</p>
            <p className="text-sm">
              {canCreate
                ? "Create your first project to get started."
                : "You haven't been added to any projects yet."}
            </p>
          </div>
          {canCreate && (
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {meta.page} of {totalPages} ({meta.total} projects)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
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
