"use client";

import ProjectListPage from "@/components/modules/Project/ProjectListPage";

export default function AdminProjectsPage() {
  return (
    <ProjectListPage
      userRole="ADMIN"
      basePath="/admin/dashboard/projects"
    />
  );
}
