"use client";

import ProjectDetailPage from "@/components/modules/Project/ProjectDetailPage";
import { use } from "react";

export default function TMProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProjectDetailPage
      projectId={id}
      userRole="TEAM_MEMBER"
      backPath="/team-member/dashboard/projects"
    />
  );
}
