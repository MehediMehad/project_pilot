"use client";

import ProjectListPage from "@/components/modules/Project/ProjectListPage";

export default function PMProjectsPage() {
  return (
    <ProjectListPage
      userRole="PROJECT_MANAGER"
      basePath="/project-manager/dashboard/projects"
    />
  );
}
