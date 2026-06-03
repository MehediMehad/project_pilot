"use client";

import DashboardOverview from "@/components/modules/Dashboard/DashboardOverview";

export default function ProjectManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          PM Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Real-time updates, project progress, team workloads, and deadlines.
        </p>
      </div>

      <DashboardOverview userRole="PROJECT_MANAGER" />
    </div>
  );
}
