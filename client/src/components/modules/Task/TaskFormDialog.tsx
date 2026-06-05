"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createTaskSchema, updateTaskSchema } from "@/zod/task.validation";
import { createTask, updateTask } from "@/services/task/taskManagement";
import { getAllProjects, getProjectMembers } from "@/services/project/projectManagement";
import { IProject, IProjectMember, ITask, TaskPriority, TaskStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  task?: ITask | null; // If provided, we're editing
  preSelectedProjectId?: string; // If provided, we lock task creation to this project
}

export default function TaskFormDialog({
  open,
  onOpenChange,
  onSuccess,
  task,
  preSelectedProjectId,
}: TaskFormDialogProps) {
  const isEdit = !!task;
  const [isPending, setIsPending] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "TODO");
  const [projectId, setProjectId] = useState(preSelectedProjectId || task?.projectId || "");
  const [assignedToId, setAssignedToId] = useState(task?.assignedToId || "");

  const [projects, setProjects] = useState<IProject[]>([]);
  const [members, setMembers] = useState<IProjectMember[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes/changes mode
  useEffect(() => {
    if (open) {
      setTitle(task?.title || "");
      setDescription(task?.description || "");
      setDueDate(task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setPriority(task?.priority || "MEDIUM");
      setStatus(task?.status || "TODO");
      setProjectId(preSelectedProjectId || task?.projectId || "");
      setAssignedToId(task?.assignedToId || "");
      setErrors({});
    }
  }, [open, task, preSelectedProjectId]);

  // Fetch all projects if not locked to preSelectedProjectId
  useEffect(() => {
    if (open && !preSelectedProjectId && !task) {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
          const res = await getAllProjects({ limit: 100 });
          if (res.success && res.data) {
            setProjects(res.data.data);
          }
        } catch (error) {
          console.error("Failed to load projects", error);
        } finally {
          setIsLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [open, preSelectedProjectId, task]);

  // Fetch members of selected project for assignment
  useEffect(() => {
    if (open && projectId) {
      const fetchMembers = async () => {
        setIsLoadingMembers(true);
        try {
          const res = await getProjectMembers(projectId);
          if (res.success && res.data) {
            setMembers(res.data);
          } else {
            setMembers([]);
          }
        } catch (error) {
          console.error("Failed to load members", error);
          setMembers([]);
        } finally {
          setIsLoadingMembers(false);
        }
      };
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [open, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      title,
      description: description || undefined,
      dueDate,
      priority,
      status,
      projectId,
      assignedToId: assignedToId || null,
    };

    const schema = isEdit ? updateTaskSchema : createTaskSchema;
    const result = schema.safeParse(payload);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0]?.toString()] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsPending(true);
    try {
      let res;
      if (isEdit && task) {
        res = await updateTask(task.id, task.projectId, payload);
      } else {
        res = await createTask({
          ...payload,
          projectId: payload.projectId || "",
        });
      }

      if (res.success) {
        toast.success(res.message || `Task ${isEdit ? "updated" : "created"} successfully!`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.message || `Failed to ${isEdit ? "update" : "create"} task`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task details..."
              rows={3}
            />
          </div>

          {/* Project Selection (Hidden/Disabled if preSelectedProjectId is set or in edit mode) */}
          {!preSelectedProjectId && !isEdit && (
            <div className="space-y-2">
              <Label htmlFor="task-project">Project</Label>
              <Select
                value={projectId || undefined}
                onValueChange={(value) => {
                  setProjectId(value);
                  setAssignedToId(""); // reset assignee on project change
                }}
                disabled={isLoadingProjects}
              >
                <SelectTrigger id="task-project" className="w-full h-10 bg-background text-foreground">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-xs text-red-500">{errors.projectId}</p>
              )}
            </div>
          )}

          {/* Due Date & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col justify-end">
              <Label htmlFor="task-duedate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="task-duedate"
                    variant={"outline"}
                    className={cn(
                      "w-full h-10 pl-3 text-left font-normal bg-background border-input",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    {dueDate ? (
                      format(new Date(dueDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        setDueDate(`${year}-${month}-${day}`);
                      } else {
                        setDueDate("");
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-xs text-red-500">{errors.dueDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select
                value={assignedToId || "UNASSIGNED"}
                onValueChange={(value) => setAssignedToId(value === "UNASSIGNED" ? "" : value)}
                disabled={isLoadingMembers || !projectId}
              >
                <SelectTrigger id="task-assignee" className="w-full h-10 bg-background text-foreground">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.role.replace("_", " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="task-priority" className="w-full h-10 bg-background text-foreground">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="task-status" className="w-full h-10 bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Task"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
