"use client";

import { useEffect, useState, useCallback } from "react";
import { IProjectDetail, IProjectSummary } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import {
  getSingleProject,
  deleteProject,
  getProjectSummary,
} from "@/services/project/projectManagement";
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectMemberManager from "./ProjectMemberManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";

interface ProjectDetailPageProps {
  projectId: string;
  userRole: UserRole;
  backPath: string; // e.g., "/admin/dashboard/projects"
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  ON_HOLD: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export default function ProjectDetailPage({
  projectId,
  userRole,
  backPath,
}: ProjectDetailPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<IProjectDetail | null>(null);
  const [summary, setSummary] = useState<IProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, summaryRes] = await Promise.all([
        getSingleProject(projectId),
        getProjectSummary(projectId),
      ]);

      if (projectRes.success) {
        setProject(projectRes.data);
      } else {
        toast.error(projectRes.message || "Failed to fetch project");
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
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
      <div className="flex h-64 items-center justify-center rounded-md border bg-card text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span>Loading project details...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-md border bg-card text-muted-foreground gap-3">
        <p className="font-medium">Project not found</p>
        <Link href={backPath}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const deadlineDate = new Date(project.deadline);
  const isOverdue =
    deadlineDate < new Date() && project.status !== "COMPLETED";
  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Back Button and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={backPath}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">{project.name}</CardTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 ${statusColors[project.status]}`}
            >
              {statusLabels[project.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {isOverdue ? "Overdue: " : "Deadline: "}
                {formattedDeadline}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>{project._count.tasks} Tasks</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{project._count.members} Members</span>
            </div>
            <div className="text-muted-foreground">
              Created by{" "}
              <span className="font-medium text-foreground">
                {project.createdBy.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {summary.taskStats.total}
                </p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.taskStats.todo}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {summary.taskStats.inProgress}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {summary.taskStats.completed}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Members Section */}
      <ProjectMemberManager
        projectId={projectId}
        members={project.members}
        createdById={project.createdById}
        userRole={userRole}
        onMembersChanged={fetchProject}
      />

      {/* Member Workload */}
      {summary && summary.memberWorkload.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Member Workload</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.memberWorkload.map((mw) => (
                <Card key={mw.user.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {mw.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{mw.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {mw.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="font-bold text-lg">
                          {mw.totalTasks}
                        </span>
                        <p className="text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <span className="font-bold text-lg text-green-600">
                          {mw.completedTasks}
                        </span>
                        <p className="text-muted-foreground">Done</p>
                      </div>
                      <div>
                        <span className="font-bold text-lg text-yellow-600">
                          {mw.pendingTasks}
                        </span>
                        <p className="text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

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
