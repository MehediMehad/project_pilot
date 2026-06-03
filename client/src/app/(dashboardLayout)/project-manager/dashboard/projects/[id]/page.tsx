"use client";

import ProjectDetailPage from "@/components/modules/Project/ProjectDetailPage";
import { use } from "react";

export default function PMProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProjectDetailPage
      projectId={id}
      userRole="PROJECT_MANAGER"
      backPath="/project-manager/dashboard/projects"
    />
  );
}
