"use client";

import DashboardOverview from "@/components/modules/Dashboard/DashboardOverview";

export default function TeamMemberDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Your tasks, upcoming deadlines, project statistics, and activities.
        </p>
      </div>

      <DashboardOverview userRole="TEAM_MEMBER" />
    </div>
  );
}
