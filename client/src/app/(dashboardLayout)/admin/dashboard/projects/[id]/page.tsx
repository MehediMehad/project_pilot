"use client";

import ProjectDetailPage from "@/components/modules/Project/ProjectDetailPage";
import { use } from "react";

export default function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProjectDetailPage
      projectId={id}
      userRole="ADMIN"
      backPath="/admin/dashboard/projects"
    />
  );
}
