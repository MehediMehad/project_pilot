"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { createProjectSchema, updateProjectSchema } from "@/zod/project.validation";
import { createProject, updateProject } from "@/services/project/projectManagement";
import { IProject, ProjectStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  project?: IProject | null; // if provided, we're editing
}

export default function ProjectFormDialog({
  open,
  onOpenChange,
  onSuccess,
  project,
}: ProjectFormDialogProps) {
  const isEdit = !!project;
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [deadline, setDeadline] = useState(
    project?.deadline ? new Date(project.deadline).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(project?.status || "ACTIVE");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    if (!isEdit) {
      setName("");
      setDescription("");
      setDeadline("");
      setStatus("ACTIVE");
    }
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = { name, description: description || undefined, deadline, status };

    const schema = isEdit ? updateProjectSchema : createProjectSchema;
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
      if (isEdit && project) {
        res = await updateProject(project.id, payload);
      } else {
        res = await createProject(payload);
      }

      if (res.success) {
        toast.success(res.message || `Project ${isEdit ? "updated" : "created"} successfully!`);
        resetForm();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.message || `Failed to ${isEdit ? "update" : "create"} project`);
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
          <DialogTitle>{isEdit ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Deadline</Label>
              <Input
                id="project-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              {errors.deadline && (
                <p className="text-xs text-red-500">{errors.deadline}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatus)}
              >
                <SelectTrigger id="project-status" className="w-full h-10 bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
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
                "Update Project"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
