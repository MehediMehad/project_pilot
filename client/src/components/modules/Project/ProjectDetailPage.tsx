"use client";

import { useEffect, useState, useCallback } from "react";
import { IProjectDetail, IProjectSummary, ITask } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import {
  getSingleProject,
  deleteProject,
  getProjectSummary,
} from "@/services/project/projectManagement";
import { getAllTasks } from "@/services/task/taskManagement";
import ProjectMemberManager from "./ProjectMemberManager";
import ProjectFormDialog from "./ProjectFormDialog";
import TaskCard from "../Task/TaskCard";
import TaskFormDialog from "../Task/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Edit,
  Loader2,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  User,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface ProjectDetailPageProps {
  projectId: string;
  userRole: UserRole;
  backPath: string; // e.g., "/admin/dashboard/projects"
}

const statusStyles: Record<
  string,
  { badge: string; icon: any; label: string }
> = {
  ACTIVE: {
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50/85",
    icon: CheckCircle2,
    label: "Active",
  },
  COMPLETED: {
    badge: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50/85",
    icon: CheckCircle2,
    label: "Completed",
  },
  ON_HOLD: {
    badge: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50/85",
    icon: Clock,
    label: "On Hold",
  },
};

export default function ProjectDetailPage({
  projectId,
  userRole,
  backPath,
}: ProjectDetailPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<IProjectDetail | null>(null);
  const [summary, setSummary] = useState<IProjectSummary | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, summaryRes, tasksRes] = await Promise.all([
        getSingleProject(projectId),
        getProjectSummary(projectId),
        getAllTasks({ projectId, limit: 100 }),
      ]);

      if (projectRes.success) {
        setProject(projectRes.data);
      } else {
        toast.error(projectRes.message || "Failed to fetch project");
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }

      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteProject(projectId);
      if (res.success) {
        toast.success("Project deleted successfully!");
        router.push(backPath);
      } else {
        toast.error(res.message || "Failed to delete project");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-medium">
            Loading project details...
          </span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm gap-3">
        <p className="font-semibold text-gray-700">Project not found</p>
        <Link href={backPath}>
          <Button
            variant="outline"
            className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status !== "COMPLETED";

  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statusConfig = statusStyles[project.status] || statusStyles.ACTIVE;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Back Button and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backPath}
          className="text-primary hover:text-primary/80 flex items-center gap-1.5 font-bold transition-all text-sm"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Projects
        </Link>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Project Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight leading-snug truncate">
                {project.name}
              </h1>
              <Badge
                variant="outline"
                className={`shrink-0 text-[11px] font-semibold rounded-full px-3 py-1 flex items-center gap-1.5 border ${statusConfig.badge}`}
              >
                <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                {statusConfig.label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Metrics Capsules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-50">
          {/* Deadline */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-primary p-2.5 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                Deadline
              </p>
              <p className="text-[14px] font-extrabold text-gray-900 mt-1 leading-none">
                {formattedDeadline}
              </p>
            </div>
          </div>

          {/* Total Tasks */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-primary p-2.5 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                Total Tasks
              </p>
              <p className="text-[14px] font-extrabold text-gray-900 mt-1 leading-none">
                {project._count.tasks}
              </p>
            </div>
          </div>

          {/* Total Members */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                Total Members
              </p>
              <p className="text-[14px] font-extrabold text-gray-900 mt-1 leading-none">
                {project._count.members}
              </p>
            </div>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                Created by
              </p>
              <p className="text-[14px] font-extrabold text-gray-900 mt-1 leading-none">
                {project.createdBy.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      {summary && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Tasks */}
          <div className="border-t-[3px] border-t-primary bg-white rounded-xl border-l border-r border-b border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-indigo-50/80 flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {summary.taskStats.total}
              </p>
              <p className="text-[12px] font-semibold text-gray-400 mt-1">
                Total Tasks
              </p>
            </div>
          </div>

          {/* Card 2: To Do */}
          <div className="border-t-[3px] border-t-blue-500 bg-white rounded-xl border-l border-r border-b border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-50/80 flex items-center justify-center shrink-0">
              <ListTodo className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {summary.taskStats.todo}
              </p>
              <p className="text-[12px] font-semibold text-gray-400 mt-1">
                To Do
              </p>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="border-t-[3px] border-t-amber-500 bg-white rounded-xl border-l border-r border-b border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-amber-50/80 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {summary.taskStats.inProgress}
              </p>
              <p className="text-[12px] font-semibold text-gray-400 mt-1">
                In Progress
              </p>
            </div>
          </div>

          {/* Card 4: Completed */}
          <div className="border-t-[3px] border-t-emerald-500 bg-white rounded-xl border-l border-r border-b border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-emerald-50/80 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {summary.taskStats.completed}
              </p>
              <p className="text-[12px] font-semibold text-gray-400 mt-1">
                Completed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Section */}
      <div className="mt-8">
        <ProjectMemberManager
          projectId={projectId}
          members={project.members}
          createdById={project.createdById}
          userRole={userRole}
          onMembersChanged={fetchProject}
        />
      </div>

      {/* Member Workload Section */}
      {summary && summary.memberWorkload.length > 0 && (
        <div className="mt-8 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Member Workload</h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {summary.memberWorkload.map((mw) => (
              <div
                key={mw.user.id}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="h-10 w-10 rounded-full bg-indigo-50/80 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {mw.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">
                      {mw.user.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {mw.user.email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50 text-center">
                  <div className="border-r border-gray-100">
                    <span className="text-[18px] font-extrabold text-gray-900">
                      {mw.totalTasks}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Total
                    </p>
                  </div>
                  <div className="border-r border-gray-100">
                    <span className="text-[18px] font-extrabold text-emerald-600">
                      {mw.completedTasks}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Done
                    </p>
                  </div>
                  <div>
                    <span className="text-[18px] font-extrabold text-amber-500">
                      {mw.pendingTasks}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Pending
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Tasks Section */}
      <div className="mt-8 pt-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Project Tasks</h3>
          </div>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setTaskDialogOpen(true);
              }}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-gray-50/50 border-dashed text-gray-400">
            <ListTodo className="h-8 w-8 mb-2" />
            <p className="font-semibold text-sm">No tasks created yet</p>
            {canEdit && (
              <p className="text-xs mt-1">Get started by adding a task to this project.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                userRole={userRole}
                onEdit={(t) => {
                  setEditingTask(t);
                  setTaskDialogOpen(true);
                }}
                onDeleteSuccess={fetchProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Creation/Editing Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSuccess={fetchProject}
        task={editingTask}
        preSelectedProjectId={projectId}
      />

      {/* Edit Dialog */}
      {project && (
        <ProjectFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchProject}
          project={project}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This
              will permanently remove the project and all its tasks, comments,
              and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
