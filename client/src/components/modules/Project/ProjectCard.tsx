"use client";

import { IProject, ProjectStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, ListTodo } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
  project: IProject;
  basePath: string;
}

const statusColors: Record<
  ProjectStatus,
  { border: string; badge: string; label: string }
> = {
  ACTIVE: {
    border: "border-t-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50/80",
    label: "Active",
  },
  COMPLETED: {
    border: "border-t-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50/80",
    label: "Completed",
  },
  ON_HOLD: {
    border: "border-t-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50/80",
    label: "On Hold",
  },
};

export default function ProjectCard({ project, basePath }: ProjectCardProps) {
  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status !== "COMPLETED";

  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const config = statusColors[project.status] || statusColors.ACTIVE;

  return (
    <Link href={`${basePath}/${project.id}`} className="block h-full">
      <div
        className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg h-full border-t-4 ${config.border} bg-white rounded-xl border-l border-r border-b border-gray-100 flex flex-col justify-between`}
      >
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Header: Title and Status Badge */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-[16px] font-bold text-gray-900 tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {project.name}
              </h3>
              <Badge
                variant="outline"
                className={`shrink-0 text-[11px] font-medium rounded-full px-2.5 py-0.5 border ${config.badge}`}
              >
                {config.label}
              </Badge>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 mb-4">
                {project.description}
              </p>
            )}
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 mt-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/60 text-indigo-600 rounded-lg text-xs font-semibold">
              <ListTodo className="h-3.5 w-3.5" />
              <span>
                {project._count.tasks}{" "}
                {project._count.tasks === 1 ? "Task" : "Tasks"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/60 text-indigo-600 rounded-lg text-xs font-semibold">
              <Users className="h-3.5 w-3.5" />
              <span>
                {project._count.members}{" "}
                {project._count.members === 1 ? "Member" : "Members"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-white text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={isOverdue ? "text-red-500 font-bold" : ""}>
              Due: {formattedDeadline}
            </span>
          </div>
          <div className="border-l border-gray-100 pl-4 py-0.5">
            <span className="text-gray-400">by </span>
            <span className="text-gray-600 font-semibold">
              {project.createdBy.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
