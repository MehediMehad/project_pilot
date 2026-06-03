"use client";

import { useEffect, useState } from "react";
import { IProject, IPaginationMeta } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import { getAllProjects } from "@/services/project/projectManagement";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-9 bg-white border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg text-sm transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-9 w-[140px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 font-medium hover:border-gray-300 outline-none transition-all shadow-sm"
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
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <span className="text-sm font-medium">Loading projects...</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm gap-3">
          <FolderKanban className="h-12 w-12 text-gray-300" />
          <div className="text-center">
            <p className="font-semibold text-gray-700">No projects found</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {canCreate
                ? "Create your first project to get started."
                : "You haven't been added to any projects yet."}
            </p>
          </div>
          {canCreate && (
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl gap-2 px-4 py-2"
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
