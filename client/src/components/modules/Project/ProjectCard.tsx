"use client";

import { IProject } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Users, ClipboardList } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
  project: IProject;
  basePath: string;
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

export default function ProjectCard({ project, basePath }: ProjectCardProps) {
  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status !== "COMPLETED";
  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`${basePath}/${project.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] ${statusColors[project.status]}`}
            >
              {statusLabels[project.status]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {project.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>{project._count.tasks} tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{project._count.members} members</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {isOverdue ? "Overdue: " : "Due: "}
                {formattedDeadline}
              </span>
            </div>
            <span className="text-muted-foreground">
              by {project.createdBy.name}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
