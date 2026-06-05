"use client";

import { useState } from "react";
import { ITask, TaskPriority, TaskStatus } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import { Calendar, User2, Edit2, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTask, deleteTask } from "@/services/task/taskManagement";
import { toast } from "sonner";
import TaskDetailsDialog from "./TaskDetailsDialog";

interface TaskCardProps {
  task: ITask;
  userRole: UserRole;
  currentUserId?: string;
  onEdit: (task: ITask) => void;
  onDeleteSuccess: () => void;
}

export default function TaskCard({
  task,
  userRole,
  currentUserId,
  onEdit,
  onDeleteSuccess,
}: TaskCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Status colors
  const statusColors = {
    TODO: "border-t-orange-500",
    IN_PROGRESS: "border-t-indigo-500",
    COMPLETED: "border-t-green-500",
  };

  const statusBgColors = {
    TODO: "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400",
    COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400",
  };

  const statusIcons = {
    TODO: <Circle className="h-4 w-4" />,
    IN_PROGRESS: <Clock className="h-4 w-4" />,
    COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  };

  // Priority colors
  const priorityColors = {
    HIGH: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400",
    MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
    LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const isManagerOrAdmin = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsPending(true);
    try {
      const res = await updateTask(task.id, task.projectId, { status: newStatus });
      if (res.success) {
        setStatus(newStatus);
        toast.success("Task status updated!");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsPending(true);
    try {
      deleteTask(task.id, task.projectId).then((res) => {
        if (res.success) {
          toast.success("Task deleted successfully!");
          onDeleteSuccess();
        } else {
          toast.error("Failed to delete task");
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Error deleting task");
    } finally {
      setIsPending(false);
    }
  };

  // Date formatting
  const formattedDate = new Date(task.dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div
        onClick={() => setIsDetailsOpen(true)}
        className={`bg-card text-card-foreground border border-t-4 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between cursor-pointer ${statusColors[status]}`}
      >
        <div className="p-5 space-y-4">
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}
            >
              {task.priority} Priority
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${statusBgColors[status]}`}
            >
              {statusIcons[status]}
              {status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Completed"}
            </span>
          </div>

          {/* Title & Desc */}
          <div>
            <h4 className="font-semibold text-lg text-foreground line-clamp-1">{task.title}</h4>
            {task.description ? (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{task.description}</p>
            ) : (
              <p className="text-muted-foreground text-sm mt-1 italic">No description</p>
            )}
          </div>

          {/* Project Name (if available) */}
          {task.project && (
            <div className="text-xs bg-muted/50 dark:bg-muted/30 px-3 py-1.5 rounded-lg inline-block w-fit text-muted-foreground border">
              Project: <span className="font-semibold text-foreground">{task.project.name}</span>
            </div>
          )}
        </div>

        {/* Footer Details */}
        <div className="px-5 py-4 border-t border-muted/80 bg-muted/10 dark:bg-muted/5 flex items-center justify-between gap-4">
          {/* Due Date & Assignee */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground truncate max-w-[80px]">
                {task.assignedTo ? task.assignedTo.name : "Unassigned"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Quick status selector */}
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              onClick={(e) => e.stopPropagation()}
              disabled={isPending || (userRole === "TEAM_MEMBER" && task.assignedToId !== currentUserId)}
              className="text-xs bg-background border rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {isManagerOrAdmin && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  disabled={isPending}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <TaskDetailsDialog
        task={{ ...task, status }}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        userRole={userRole}
        currentUserId={currentUserId}
      />
    </>
  );
}
