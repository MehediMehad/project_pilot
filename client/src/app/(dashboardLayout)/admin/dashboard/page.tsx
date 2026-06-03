"use client";

import DashboardOverview from "@/components/modules/Dashboard/DashboardOverview";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workspace Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Real-time metrics, status analytics, project progress, and workloads.
        </p>
      </div>

      <DashboardOverview userRole="ADMIN" />
    </div>
  );
}
