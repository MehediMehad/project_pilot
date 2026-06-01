import { AppointmentBarChart } from "@/components/charts/AppointmentBarChart";
import { AppointmentPieChart } from "@/components/charts/AppointmentPieChart";
import { StatsCard } from "@/components/cards/StatCard";

function AdminDashboardContent() {
  // Mock data for the metrics cards
  const mockData = {
    userCount: 1245,
    activeSessions: 84,
    apiRequests: 98420,
    serverUptime: "99.9%",
    avgResponseTime: "120ms",
    cpuLoad: "12%",
    barChartData: [
      { month: "2026-01-01", count: 120 },
      { month: "2026-02-01", count: 190 },
      { month: "2026-03-01", count: 220 },
      { month: "2026-04-01", count: 310 },
      { month: "2026-05-01", count: 480 },
      { month: "2026-06-01", count: 540 }
    ],
    pieChartData: [
      { status: "COMPLETED", count: 65 },
      { status: "SCHEDULED", count: 25 },
      { status: "CANCELED", count: 10 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Users"
          value={mockData.userCount.toLocaleString()}
          iconName="Users"
          description="Registered users"
          iconClassName="bg-primary/10"
        />
        <StatsCard
          title="Active Sessions"
          value={mockData.activeSessions.toString()}
          iconName="Activity"
          description="Concurrent users"
          iconClassName="bg-green-100"
        />
        <StatsCard
          title="API Requests"
          value={mockData.apiRequests.toLocaleString()}
          iconName="Cpu"
          description="Total processed"
          iconClassName="bg-purple-100"
        />
        <StatsCard
          title="Avg Response"
          value={mockData.avgResponseTime}
          iconName="Zap"
          description="Backend response speed"
          iconClassName="bg-orange-100"
        />
        <StatsCard
          title="CPU Load"
          value={mockData.cpuLoad}
          iconName="Gauge"
          description="Current cluster CPU load"
          iconClassName="bg-secondary"
        />
        <StatsCard
          title="Server Uptime"
          value={mockData.serverUptime}
          iconName="Shield"
          description="Service level agreement"
          iconClassName="bg-emerald-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AppointmentBarChart data={mockData.barChartData} />
        <AppointmentPieChart 
          data={mockData.pieChartData} 
          title="System Load Distribution"
          description="Overview of current node tasks and health statuses"
        />
      </div>
    </div>
  );
}

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Real-time metrics and system health indicators
        </p>
      </div>

      <AdminDashboardContent />
    </div>
  );
};

export default AdminDashboardPage;
