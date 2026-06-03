"use client";

import ProjectListPage from "@/components/modules/Project/ProjectListPage";

export default function TMProjectsPage() {
  return (
    <ProjectListPage
      userRole="TEAM_MEMBER"
      basePath="/team-member/dashboard/projects"
    />
  );
}
