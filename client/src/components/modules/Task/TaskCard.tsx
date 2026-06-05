"use client";

import { useState, useEffect } from "react";
import { ITask, TaskPriority, TaskStatus } from "@/types";
import { UserRole } from "@/lib/auth/auth-utils";
import { Calendar, User2, Edit2, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTask, deleteTask } from "@/services/task/taskManagement";
import { toast } from "sonner";
import TaskDetailsDialog from "./TaskDetailsDialog";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setStatus(task.status);
    setPriority(task.priority);
  }, [task.status, task.priority]);

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
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = () => {
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
        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-card/65 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border-t-4 border-l border-r border-b border-l-border border-r-border border-b-border dark:border-l-slate-700/60 dark:border-r-slate-700/60 dark:border-b-slate-700/60 flex flex-col justify-between ${statusColors[status]}`}
      >
        <div className="p-5 space-y-4">
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${priorityColors[priority]}`}
            >
              {priority} Priority
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
        <div className="px-5 py-4 border-t border-border dark:border-slate-700/60 bg-card/30 dark:bg-slate-950/20 flex items-center justify-between gap-4">
          {/* Due Date & Assignee */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {task.assignedTo ? (
                <div className="h-5 w-5 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/60">
                  {task.assignedTo.image ? (
                    <img
                      src={task.assignedTo.image}
                      alt={task.assignedTo.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ) : (
                <User2 className="h-3.5 w-3.5" />
              )}
              <span className="font-medium text-foreground truncate max-w-[80px]">
                {task.assignedTo ? task.assignedTo.name : "Unassigned"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Quick status selector */}
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={status}
                onValueChange={(value) => handleStatusChange(value as TaskStatus)}
                disabled={isPending || (userRole === "TEAM_MEMBER" && task.assignedToId !== currentUserId)}
              >
                <SelectTrigger className="h-7 text-xs bg-background text-foreground px-2">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
        task={{ ...task, status, priority }}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        userRole={userRole}
        currentUserId={currentUserId}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDeleteConfirmed}
        title="Delete Task"
        description="Are you sure you want to permanently delete this task? This action cannot be undone."
      />
    </>
  );
}
